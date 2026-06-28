import type ts from "typescript";
import * as fs from "fs";

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LUAU_TYPE: Record<string, string> = {
    number: "number",
    string: "string",
    boolean: "boolean",
    void: "()",
    Vector3: "Vector3",
    Vector2: "Vector2",
    Vector2int16: "Vector2int16",
    Vector3int16: "Vector3int16",
    CFrame: "CFrame",
    UDim: "UDim",
    UDim2: "UDim2",
    Color3: "Color3",
    BrickColor: "BrickColor",
    TweenInfo: "TweenInfo",
    NumberRange: "NumberRange",
    NumberSequence: "NumberSequence",
    ColorSequence: "ColorSequence",
    Rect: "Rect",
    Region3: "Region3",
    Ray: "Ray",
    buffer: "buffer",
    Instance: "Instance",
    BasePart: "BasePart",
    Part: "Part",
    Model: "Model",
    Player: "Player",
    Camera: "Camera",
    Workspace: "Workspace",
    RunService: "RunService",
    Players: "Players",
};

function mapTypeNode(ts: typeof import("typescript"), typeNode: ts.TypeNode): string | null {
    if (ts.isTypeReferenceNode(typeNode)) {
        const name = ts.isIdentifier(typeNode.typeName) ? typeNode.typeName.text : null;
        if (!name) return null;
        if (LUAU_TYPE[name]) return LUAU_TYPE[name];
        if ((name === "Array" || name === "ReadonlyArray") && typeNode.typeArguments?.length === 1) {
            const inner = mapTypeNode(ts, typeNode.typeArguments[0]);
            return inner ? `{${inner}}` : "{any}";
        }
        // LuaTuple<[T, U]> → Luau multi-return (T, U)
        if (name === "LuaTuple" && typeNode.typeArguments?.length === 1) {
            const arg = typeNode.typeArguments[0];
            if (ts.isTupleTypeNode(arg)) {
                const elements = arg.elements
                    .map(e => {
                        const el = "type" in e ? (e as ts.NamedTupleMember).type : e;
                        return mapTypeNode(ts, el as ts.TypeNode);
                    })
                    .filter((t): t is string => t !== null);
                if (elements.length > 0) return `(${elements.join(", ")})`;
            }
        }
        return null;
    }
    if (ts.isArrayTypeNode(typeNode)) {
        const inner = mapTypeNode(ts, typeNode.elementType);
        return inner ? `{${inner}}` : "{any}";
    }
    const kw: Partial<Record<number, string>> = {
        [ts.SyntaxKind.NumberKeyword]: "number",
        [ts.SyntaxKind.StringKeyword]: "string",
        [ts.SyntaxKind.BooleanKeyword]: "boolean",
        [ts.SyntaxKind.VoidKeyword]: "()",
    };
    if (typeNode.kind in kw) return kw[typeNode.kind]!;
    return null;
}

function luauTypeForParam(
    ts: typeof import("typescript"),
    checker: ts.TypeChecker,
    node: ts.ParameterDeclaration,
): string | null {
    if (node.type) {
        const mapped = mapTypeNode(ts, node.type);
        if (mapped) return mapped;
    }
    const name = checker.typeToString(checker.getTypeAtLocation(node));
    return LUAU_TYPE[name] ?? null;
}

function luauTypeForReturn(
    ts: typeof import("typescript"),
    checker: ts.TypeChecker,
    node: ts.FunctionDeclaration,
): string | null {
    if (node.type) {
        const mapped = mapTypeNode(ts, node.type);
        if (mapped) return mapped;
    }
    const sig = checker.getSignatureFromDeclaration(node);
    if (!sig) return null;
    const ret = checker.getReturnTypeOfSignature(sig);
    const name = checker.typeToString(ret);
    return LUAU_TYPE[name] ?? null;
}

export type FnAnnotation = {
    params: Array<string | null>;
    paramNames: Array<string>;
    ret: string | null;
};

export type FileSidecar = {
    fns: Map<string, FnAnnotation>;
    native: boolean;
    fnNative: Set<string>; // functions with @native JSDoc (annotated even without //!native file)
};

function hasJsDocTag(node: ts.Node, tagName: string): boolean {
    const jsDocs = (node as { jsDoc?: ts.JSDoc[] }).jsDoc;
    return jsDocs?.some(doc => doc.tags?.some(t => t.tagName.text === tagName)) ?? false;
}

export function collectSidecar(
    ts: typeof import("typescript"),
    program: ts.Program,
    sourceFile: ts.SourceFile,
): FileSidecar {
    const checker = program.getTypeChecker();
    const sidecar: FileSidecar = {
        fns: new Map(),
        native: /^\/\/!native\b/m.test(sourceFile.text),
        fnNative: new Set(),
    };

    function visit(node: ts.Node): void {
        if (ts.isFunctionDeclaration(node) && node.name) {
            const params = node.parameters.map(p => luauTypeForParam(ts, checker, p));
            const paramNames = node.parameters.map(p =>
                ts.isIdentifier(p.name) ? p.name.text : "_",
            );
            const ret = luauTypeForReturn(ts, checker, node);

            if (params.some(p => p !== null) || ret !== null) {
                sidecar.fns.set(node.name.text, { params, paramNames, ret });
            }
            if (hasJsDocTag(node, "native")) {
                sidecar.fnNative.add(node.name.text);
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);

    return sidecar;
}

const writingFiles = new Set<string>();

export function applyAnnotations(luauPath: string, sidecar: FileSidecar): void {
    if (writingFiles.has(luauPath)) return;
    if (!fs.existsSync(luauPath)) return;

    let src = fs.readFileSync(luauPath, "utf8");
    let changed = false;

    for (const [fnName, ann] of sidecar.fns) {
        if (!sidecar.native && !sidecar.fnNative.has(fnName)) continue;
        if (ann.params.every(p => p === null) && ann.ret === null) continue;

        const re = new RegExp(
            `(local function ${escapeRegex(fnName)}\\()([^)]*)(\\.\\.\\.)?(\\))(?:\\s*:\\s*[^\\r\\n]+)?`,
        );
        src = src.replace(re, (_m, open: string, rawParams: string, vararg: string | undefined, close: string) => {
            const names = rawParams.split(",").map((s: string) => s.trim()).filter(Boolean);
            const annotated = names.map((name: string, i: number) => {
                const bare = name.split(":")[0].trim();
                const typ = ann.params[i];
                return typ ? `${bare}: ${typ}` : bare;
            });
            if (vararg) annotated.push("...");
            const retSuffix = ann.ret ? `: ${ann.ret}` : "";
            changed = true;
            return `${open}${annotated.join(", ")}${close}${retSuffix}`;
        });
    }

    if (changed) {
        writingFiles.add(luauPath);
        try {
            fs.writeFileSync(luauPath, src, "utf8");
        } finally {
            setTimeout(() => writingFiles.delete(luauPath), 50).unref();
        }
    }
}
