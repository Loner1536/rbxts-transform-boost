"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachePass = cachePass;
const util_1 = require("../util");
const SKIP_ROOTS = new Set([
    "math",
    "string",
    "table",
    "bit32",
    "os",
    "buffer",
    "utf8",
    "coroutine",
    "io",
    "debug",
    "package",
    "game",
    "workspace",
    "script",
    "shared",
    "Vector3",
    "Vector2",
    "CFrame",
    "Color3",
    "UDim",
    "UDim2",
    "TweenInfo",
    "NumberRange",
    "NumberSequence",
    "ColorSequence",
    "Rect",
    "Region3",
    "Ray",
    "BrickColor",
    "Axes",
    "Faces",
    "Instance",
    "Enum",
    "task",
    "tick",
    "time",
    "warn",
    "error",
    "print",
    "tostring",
    "tonumber",
    "type",
    "typeof",
    "select",
    "pairs",
    "ipairs",
    "next",
    "unpack",
    "pcall",
    "xpcall",
    "setmetatable",
    "getmetatable",
    "rawget",
    "rawset",
    "rawequal",
]);
/**
 * Minimum uses required to justify hoisting, based on chain depth.
 *
 * Deeper chains save more ops per substitution so earn caching sooner:
 *   1 dot  (Foo.Bar)           → ≥ 4 uses
 *   2 dots (Foo.Bar.Baz)       → ≥ 3 uses
 *   3+ dots                    → ≥ 2 uses
 */
function minUsesForKey(key) {
    const dots = (key.match(/\./g) ?? []).length;
    if (dots <= 1)
        return 4;
    if (dots === 2)
        return 3;
    return 2;
}
const RBXTS_SERVICES_MODULE = "@rbxts/services";
/**
 * Finds every named import from "@rbxts/services" in this file's top-level
 * imports, e.g.:
 *
 *   import { Players, RunService as RS } from "@rbxts/services";
 *
 * Returns a map of localName -> serviceName, e.g. { Players: "Players", RS: "RunService" }.
 * Also returns the ImportDeclaration nodes themselves so the caller can
 * strip them from the output — we replace the whole import with direct
 * GetService locals, so the barrel import must not survive into roblox-ts's
 * own import-emission step (that's what produces the `_services` local and
 * splits its property-access bindings away from it).
 */
function findServicesImports(ts, sourceFile) {
    const bindings = new Map();
    const importNodes = new Set();
    for (const stmt of sourceFile.statements) {
        if (!ts.isImportDeclaration(stmt))
            continue;
        if (!ts.isStringLiteral(stmt.moduleSpecifier))
            continue;
        if (stmt.moduleSpecifier.text !== RBXTS_SERVICES_MODULE)
            continue;
        const clause = stmt.importClause;
        if (!clause ||
            !clause.namedBindings ||
            !ts.isNamedImports(clause.namedBindings))
            continue;
        for (const el of clause.namedBindings.elements) {
            // el.propertyName is set for `X as Y`; el.name is always the local name.
            const serviceName = (el.propertyName ?? el.name).text;
            const localName = el.name.text;
            bindings.set(localName, serviceName);
        }
        importNodes.add(stmt);
    }
    return { bindings, importNodes };
}
function isGetServiceCall(ts, node) {
    if (!ts.isCallExpression(node))
        return false;
    const expr = node.expression;
    if (!ts.isPropertyAccessExpression(expr))
        return false;
    const obj = expr.expression;
    return (ts.isIdentifier(obj) &&
        obj.text === "game" &&
        expr.name.text === "GetService");
}
function getServiceName(ts, call) {
    const args = call.arguments;
    if (args.length !== 1)
        return undefined;
    const arg = args[0];
    if (!ts.isStringLiteral(arg))
        return undefined;
    return arg.text;
}
function isNullableType(ts, type) {
    if (type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null))
        return true;
    if (type.isUnion()) {
        return type.types.some((t) => !!(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)));
    }
    return false;
}
/**
 * Safe wrapper around checker.getTypeAtLocation. Returns undefined if the node
 * is synthetic/detached or if the call throws. Synthetic nodes produced by
 * earlier passes have no source position — calling getTypeAtLocation on them
 * crashes with "Cannot read properties of undefined (reading 'kind')".
 */
function safeGetType(ts, checker, node) {
    try {
        const sf = node.getSourceFile();
        if (!sf || node.pos < 0)
            return undefined;
        return checker.getTypeAtLocation(node);
    }
    catch {
        return undefined;
    }
}
/**
 * Get the *declared* (un-narrowed) type of any expression by going through
 * its symbol's declaration rather than the usage site.
 *
 * Critical for cases like `Client.Ground.Floor` where at the call site the
 * control-flow-narrowed type is `BasePart` (inside an `if (Floor)` guard),
 * but the declared type is `BasePart | undefined`. We must check the declared
 * type to know whether hoisting *above* that guard is safe.
 */
function getDeclaredType(ts, checker, node) {
    try {
        const symbol = checker.getSymbolAtLocation(node);
        if (!symbol)
            return safeGetType(ts, checker, node);
        const decls = symbol.getDeclarations();
        if (!decls || decls.length === 0)
            return safeGetType(ts, checker, node);
        return checker.getTypeAtLocation(decls[0]);
    }
    catch {
        return undefined;
    }
}
/**
 * Checks whether ANY segment of the property access chain has a nullable
 * declared type. Uses declared types (not narrowed usage-site types) for
 * every segment so that control-flow narrowing inside guards doesn't hide
 * real nullability from us.
 *
 * Returns a short reason string if nullable, undefined if safe to hoist.
 *
 * Callers wrap each intermediate segment with `!` (createNonNullExpression)
 * so the full chain becomes e.g. Client.Ground.Floor!.CFrame! instead of
 * Client.Ground.Floor.CFrame! which TS rejects.
 */
function nullableSegmentReason(ts, checker, node) {
    let cur = node;
    while (ts.isPropertyAccessExpression(cur)) {
        const declared = getDeclaredType(ts, checker, cur);
        if (declared && isNullableType(ts, declared)) {
            return `'${(0, util_1.chainKey)(ts, cur) ?? "?"}' is possibly undefined`;
        }
        try {
            const sym = checker.getSymbolAtLocation(cur);
            if (sym && sym.flags & ts.SymbolFlags.Optional) {
                return `'${(0, util_1.chainKey)(ts, cur) ?? "?"}' is an optional property`;
            }
        }
        catch {
            /* synthetic node */
        }
        cur = cur.expression;
    }
    const rootDeclared = getDeclaredType(ts, checker, cur);
    if (rootDeclared && isNullableType(ts, rootDeclared)) {
        const name = ts.isIdentifier(cur) ? cur.text : "?";
        return `root '${name}' is possibly undefined`;
    }
    return undefined;
}
function cachePass(ts, program, ctx, sourceFile, dbg) {
    const factory = ctx.factory;
    const checker = program.getTypeChecker();
    let cached = 0;
    const services = new Map();
    // 1) Direct game.GetService("X") calls.
    (0, util_1.walk)(ts, sourceFile, (node) => {
        if (!node || !isGetServiceCall(ts, node))
            return;
        const name = getServiceName(ts, node);
        if (name && !services.has(name))
            services.set(name, `_${name}`);
    });
    // 2) Named imports from "@rbxts/services" — treat each one as if the
    //    user had written game.GetService("X") directly, so we never let
    //    roblox-ts emit the @rbxts/services barrel import. Left alone, that
    //    barrel import compiles to a `_services` TS.import local plus
    //    per-binding property accesses (`local Players = _services.Players`),
    //    which bypasses our GetService hoisting entirely and gets split
    //    across preamble sections by the later annotate pass.
    const { bindings: importBindings, importNodes } = findServicesImports(ts, sourceFile);
    // localName -> hoisted identifier name, used to rewrite bare references
    // to the imported binding (e.g. every `Players` -> `_Players`).
    const importLocalToHoisted = new Map();
    for (const [localName, serviceName] of importBindings) {
        if (!services.has(serviceName)) {
            services.set(serviceName, `_${serviceName}`);
        }
        importLocalToHoisted.set(localName, services.get(serviceName));
    }
    const serviceVisitor = (node) => {
        // Rewrite direct game.GetService("X") calls.
        if (isGetServiceCall(ts, node)) {
            const name = getServiceName(ts, node);
            if (name && services.has(name))
                return factory.createIdentifier(services.get(name));
        }
        // Rewrite bare references to an @rbxts/services-imported binding,
        // e.g. `Players.LocalPlayer` -> `_Players.LocalPlayer`. Only
        // identifier nodes are rewritten, so property names in a property
        // access (e.g. the `.LocalPlayer` part) are untouched — those are
        // separate nodes, not the object identifier itself.
        if (ts.isIdentifier(node) && importLocalToHoisted.has(node.text)) {
            const parent = node.parent;
            const isImportSpecifierName = parent !== undefined &&
                ts.isImportSpecifier(parent) &&
                (parent.propertyName === node || parent.name === node);
            if (!isImportSpecifierName) {
                return factory.createIdentifier(importLocalToHoisted.get(node.text));
            }
        }
        return ts.visitEachChild(node, serviceVisitor, ctx);
    };
    let result = ts.visitEachChild(sourceFile, serviceVisitor, ctx);
    // Drop the @rbxts/services import statement(s) entirely — every
    // reference has already been replaced with a hoisted GetService local,
    // so the barrel import would otherwise still get emitted by roblox-ts
    // alongside our hoisted decls, doing nothing but adding dead code.
    //
    // IMPORTANT: after ts.visitEachChild the statements in `result` are new
    // cloned nodes, so a Set<ts.ImportDeclaration> of the *original* nodes
    // will never match via identity (has() always returns false). Filter by
    // module specifier text instead, which survives the clone.
    if (importNodes.size > 0) {
        result = factory.updateSourceFile(result, result.statements.filter((s) => {
            if (!ts.isImportDeclaration(s))
                return true;
            if (!ts.isStringLiteral(s.moduleSpecifier))
                return true;
            return s.moduleSpecifier.text !== RBXTS_SERVICES_MODULE;
        }));
    }
    if (services.size > 0) {
        cached += services.size;
        const hoistDecls = Array.from(services.entries()).map(([name, localName]) => factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
            factory.createVariableDeclaration(factory.createIdentifier(localName), undefined, undefined, factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("game"), "GetService"), undefined, [factory.createStringLiteral(name)])),
        ], ts.NodeFlags.Let)));
        result = factory.updateSourceFile(result, [
            ...hoistDecls,
            ...Array.from(result.statements),
        ]);
    }
    const chainResult = hoistPropertyChains(ts, sourceFile, result, factory, ctx, checker, dbg);
    result = chainResult.result;
    cached += chainResult.cached;
    return { result, cached };
}
function hoistPropertyChains(ts, originalSourceFile, transformedSourceFile, factory, ctx, checker, dbg) {
    let totalCached = 0;
    const hoistMap = new Map();
    const analysisVisitor = (node) => {
        if (ts.isFunctionDeclaration(node) ||
            ts.isFunctionExpression(node) ||
            ts.isArrowFunction(node) ||
            ts.isMethodDeclaration(node)) {
            const fn = node;
            const result = analyseFunction(ts, fn, checker, dbg);
            if (result.toHoist.size > 0) {
                hoistMap.set(`${fn.pos}:${fn.end}`, {
                    toHoist: result.toHoist,
                    mutableSkips: result.mutableSkips,
                });
                totalCached += result.toHoist.size;
            }
        }
        ts.forEachChild(node, analysisVisitor);
    };
    ts.forEachChild(originalSourceFile, analysisVisitor);
    if (hoistMap.size === 0)
        return { result: transformedSourceFile, cached: 0 };
    const applyVisitor = (node) => {
        if (ts.isFunctionDeclaration(node) ||
            ts.isFunctionExpression(node) ||
            ts.isArrowFunction(node) ||
            ts.isMethodDeclaration(node)) {
            const fn = node;
            const entry = hoistMap.get(`${fn.pos}:${fn.end}`);
            if (entry && fn.body && ts.isBlock(fn.body)) {
                const fnName = fn.name && ts.isIdentifier(fn.name) ? fn.name.text : "<anonymous>";
                const { fn: updated } = applyHoisting(ts, fn, entry.toHoist, factory, ctx, dbg, fnName);
                return updated;
            }
        }
        return ts.visitEachChild(node, applyVisitor, ctx);
    };
    return {
        result: ts.visitEachChild(transformedSourceFile, applyVisitor, ctx),
        cached: totalCached,
    };
}
function collectMutatedIdentifiers(ts, body) {
    const mutated = new Set();
    (0, util_1.walk)(ts, body, (node) => {
        if (ts.isBinaryExpression(node)) {
            const op = node.operatorToken.kind;
            const isAssign = op === ts.SyntaxKind.EqualsToken ||
                op === ts.SyntaxKind.PlusEqualsToken ||
                op === ts.SyntaxKind.MinusEqualsToken ||
                op === ts.SyntaxKind.AsteriskEqualsToken ||
                op === ts.SyntaxKind.SlashEqualsToken ||
                op === ts.SyntaxKind.PercentEqualsToken ||
                op === ts.SyntaxKind.AmpersandEqualsToken ||
                op === ts.SyntaxKind.BarEqualsToken ||
                op === ts.SyntaxKind.CaretEqualsToken ||
                op === ts.SyntaxKind.LessThanLessThanEqualsToken ||
                op === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
                op === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken ||
                op === ts.SyntaxKind.AsteriskAsteriskEqualsToken ||
                op === ts.SyntaxKind.AmpersandAmpersandEqualsToken ||
                op === ts.SyntaxKind.BarBarEqualsToken ||
                op === ts.SyntaxKind.QuestionQuestionEqualsToken;
            if (isAssign && ts.isIdentifier(node.left)) {
                mutated.add(node.left.text);
            }
        }
        if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
            ts.isIdentifier(node.operand)) {
            mutated.add(node.operand.text);
        }
        if (ts.isVariableDeclarationList(node) && node.flags & ts.NodeFlags.Let) {
            for (const decl of node.declarations) {
                if (ts.isIdentifier(decl.name))
                    mutated.add(decl.name.text);
            }
        }
        if ((ts.isForOfStatement(node) || ts.isForInStatement(node)) &&
            ts.isIdentifier(node.initializer)) {
            const init = node
                .initializer;
            mutated.add(init.text);
        }
    });
    return mutated;
}
function collectLocalDeclaredIdentifiers(ts, body) {
    const locals = new Set();
    function collectBindingName(name) {
        if (ts.isIdentifier(name)) {
            locals.add(name.text);
        }
        else if (ts.isArrayBindingPattern(name)) {
            for (const el of name.elements) {
                if (ts.isBindingElement(el))
                    collectBindingName(el.name);
            }
        }
        else if (ts.isObjectBindingPattern(name)) {
            for (const el of name.elements) {
                collectBindingName(el.name);
            }
        }
    }
    (0, util_1.walk)(ts, body, (node) => {
        if (!ts.isVariableDeclarationList(node))
            return;
        for (const decl of node.declarations) {
            collectBindingName(decl.name);
        }
    });
    return locals;
}
function isCalleeOfCallExpression(ts, node) {
    const parent = node.parent;
    return ts.isCallExpression(parent) && parent.expression === node;
}
function chainHasBenefit(ts, checker, key, fn) {
    const root = key.split(".")[0];
    if (SKIP_ROOTS.has(root))
        return false;
    const params = new Set(fn.parameters
        .map((p) => (ts.isIdentifier(p.name) ? p.name.text : null))
        .filter((n) => n !== null));
    if (params.has(root)) {
        const param = fn.parameters.find((p) => ts.isIdentifier(p.name) && p.name.text === root);
        if (param) {
            const type = safeGetType(ts, checker, param);
            if (type) {
                const typeName = checker.typeToString(type);
                if (/^(number|string|boolean|undefined|null|void|never|unknown|any)$/.test(typeName))
                    return false;
                if (typeName.includes("=>") || typeName.startsWith("("))
                    return false;
            }
        }
        return true;
    }
    try {
        let foundLocal = false;
        if (fn.body && ts.isBlock(fn.body)) {
            (0, util_1.walkShallow)(ts, fn.body, (node) => {
                if (foundLocal)
                    return;
                if (ts.isVariableDeclaration(node) &&
                    ts.isIdentifier(node.name) &&
                    node.name.text === root) {
                    foundLocal = true;
                }
            });
        }
        return foundLocal || !SKIP_ROOTS.has(root);
    }
    catch {
        return true;
    }
}
function analyseFunction(ts, fn, checker, dbg) {
    const empty = {
        toHoist: new Map(),
        mutableSkips: [],
    };
    if (!fn.body || !ts.isBlock(fn.body))
        return empty;
    const fnName = fn.name && ts.isIdentifier(fn.name) ? fn.name.text : "<anonymous>";
    const mutatedIds = collectMutatedIdentifiers(ts, fn.body);
    const localIds = collectLocalDeclaredIdentifiers(ts, fn.body);
    function chainHasMutableSegment(key) {
        const parts = key.split(".");
        for (let i = 0; i < parts.length - 1; i++) {
            if (mutatedIds.has(parts[i]))
                return true;
        }
        return false;
    }
    const counts = new Map();
    const nodeMap = new Map();
    const usedAsCallee = new Set();
    (0, util_1.walkShallow)(ts, fn.body, (node) => {
        if (!node || !ts.isPropertyAccessExpression(node))
            return;
        const key = (0, util_1.chainKey)(ts, node);
        if (!key || !key.includes("."))
            return;
        if ((0, util_1.isAssignmentTarget)(ts, node))
            return;
        counts.set(key, (counts.get(key) ?? 0) + 1);
        if (!nodeMap.has(key))
            nodeMap.set(key, node);
        if (isCalleeOfCallExpression(ts, node))
            usedAsCallee.add(key);
    });
    const toHoist = new Map();
    const mutableSkips = [];
    let counter = 0;
    const candidates = Array.from(counts.entries())
        .filter(([key, count]) => count >= minUsesForKey(key))
        .sort((a, b) => b[0].length - a[0].length);
    const hoisted = [];
    for (const [key, count] of candidates) {
        const root = key.split(".")[0];
        if (chainHasMutableSegment(key)) {
            mutableSkips.push(key);
            continue;
        }
        if (localIds.has(root))
            continue;
        if (usedAsCallee.has(key))
            continue;
        if (!chainHasBenefit(ts, checker, key, fn))
            continue;
        const alreadyCovered = Array.from(toHoist.keys()).some((h) => h.startsWith(key + "."));
        if (alreadyCovered)
            continue;
        const repNode = nodeMap.get(key);
        const nullableReason = repNode
            ? nullableSegmentReason(ts, checker, repNode)
            : undefined;
        if (nullableReason) {
            // A nullable segment means the chain may be nil at function entry —
            // hoisting it unconditionally above any nil guard would crash at runtime.
            // Record it as a skip (shows in verbose output) and leave it in place.
            mutableSkips.push(`${key} (nullable: ${nullableReason})`);
            continue;
        }
        hoisted.push(key);
        toHoist.set(key, `_cache${counter++}`);
    }
    if (toHoist.size > 0) {
        const label = fnName === "<anonymous>"
            ? `<anon:${hoisted[0]?.split(".").pop() ?? "?"}>`
            : fnName;
        dbg.hoistInfo({
            fnName: label,
            hoisted,
            mutableSkips,
        });
    }
    return { toHoist, mutableSkips };
}
function applyHoisting(ts, fn, toHoist, factory, ctx, dbg, fnName) {
    if (!fn.body || !ts.isBlock(fn.body))
        return { fn, cached: 0 };
    try {
        const chainVisitor = (node) => {
            if (ts.isPropertyAccessExpression(node)) {
                const key = (0, util_1.chainKey)(ts, node);
                if (key && toHoist.has(key) && !(0, util_1.isAssignmentTarget)(ts, node)) {
                    return factory.createIdentifier(toHoist.get(key));
                }
            }
            return ts.visitEachChild(node, chainVisitor, ctx);
        };
        const newBody = ts.visitEachChild(fn.body, chainVisitor, ctx);
        const hoistStmts = Array.from(toHoist.entries()).map(([key, localName]) => {
            const parts = key.split(".");
            let expr = factory.createIdentifier(parts[0]);
            for (let i = 1; i < parts.length; i++) {
                expr = factory.createPropertyAccessExpression(expr, parts[i]);
            }
            return factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
                factory.createVariableDeclaration(factory.createIdentifier(localName), undefined, undefined, expr),
            ], ts.NodeFlags.Let));
        });
        const updatedBody = factory.updateBlock(newBody, [
            ...hoistStmts,
            ...Array.from(newBody.statements),
        ]);
        let updated = fn;
        if (ts.isFunctionDeclaration(fn))
            updated = factory.updateFunctionDeclaration(fn, fn.modifiers, fn.asteriskToken, fn.name, fn.typeParameters, fn.parameters, fn.type, updatedBody);
        else if (ts.isFunctionExpression(fn))
            updated = factory.updateFunctionExpression(fn, fn.modifiers, fn.asteriskToken, fn.name, fn.typeParameters, fn.parameters, fn.type, updatedBody);
        else if (ts.isArrowFunction(fn))
            updated = factory.updateArrowFunction(fn, fn.modifiers, fn.typeParameters, fn.parameters, fn.type, fn.equalsGreaterThanToken, updatedBody);
        else if (ts.isMethodDeclaration(fn))
            updated = factory.updateMethodDeclaration(fn, fn.modifiers, fn.asteriskToken, fn.name, fn.questionToken, fn.typeParameters, fn.parameters, fn.type, updatedBody);
        return { fn: updated, cached: toHoist.size };
    }
    catch (err) {
        dbg.warn("cachePass", `skipped hoisting in ${fnName}: ${err instanceof Error ? err.message : String(err)}`);
        return { fn, cached: 0 };
    }
}
