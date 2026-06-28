import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import type { PluginConfig } from "./config";
import { formatFile, type FnDoc, type FnTypes } from "./passes/format";
export type { PluginConfig };

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

function mapTypeNode(typeNode: ts.TypeNode): string | null {
    if (ts.isTypeReferenceNode(typeNode)) {
        const name = ts.isIdentifier(typeNode.typeName) ? typeNode.typeName.text : null;
        if (!name) return null;
        if (LUAU_TYPE[name]) return LUAU_TYPE[name];
        if ((name === "Array" || name === "ReadonlyArray") && typeNode.typeArguments?.length === 1) {
            const inner = mapTypeNode(typeNode.typeArguments[0]);
            return inner ? `{${inner}}` : "{any}";
        }
        if (name === "LuaTuple" && typeNode.typeArguments?.length === 1) {
            const arg = typeNode.typeArguments[0];
            if (ts.isTupleTypeNode(arg)) {
                const elements = arg.elements
                    .map(e => {
                        const el = "type" in e ? (e as ts.NamedTupleMember).type : e;
                        return mapTypeNode(el as ts.TypeNode);
                    })
                    .filter((t): t is string => t !== null);
                if (elements.length > 0) return `(${elements.join(", ")})`;
            }
        }
        return null;
    }
    if (ts.isArrayTypeNode(typeNode)) {
        const inner = mapTypeNode(typeNode.elementType);
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

function luauTypeForParam(checker: ts.TypeChecker, node: ts.ParameterDeclaration): string | null {
    if (node.type) {
        const mapped = mapTypeNode(node.type);
        if (mapped) return mapped;
    }
    const name = checker.typeToString(checker.getTypeAtLocation(node));
    return LUAU_TYPE[name] ?? null;
}

function luauTypeForReturn(checker: ts.TypeChecker, node: ts.FunctionDeclaration): string | null {
    if (node.type) {
        const mapped = mapTypeNode(node.type);
        if (mapped) return mapped;
    }
    const sig = checker.getSignatureFromDeclaration(node);
    if (!sig) return null;
    const ret = checker.getReturnTypeOfSignature(sig);
    const name = checker.typeToString(ret);
    return LUAU_TYPE[name] ?? null;
}

function collectTypes(checker: ts.TypeChecker, sourceFile: ts.SourceFile): Map<string, FnTypes> {
    const types = new Map<string, FnTypes>();
    function visit(node: ts.Node): void {
        if (ts.isFunctionDeclaration(node) && node.name) {
            const params = node.parameters.map(p => luauTypeForParam(checker, p));
            const ret = luauTypeForReturn(checker, node);
            if (params.some(p => p !== null) || ret !== null) {
                types.set(node.name.text, { params, ret });
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return types;
}

function outPathForSource(sourceFile: ts.SourceFile, program: ts.Program): string | null {
    const options = program.getCompilerOptions();
    const outDir = options.outDir;
    if (!outDir) return null;
    const rootDir = options.rootDir ?? commonRoot(program.getRootFileNames());
    if (!rootDir) return null;
    const rel = path.relative(rootDir, sourceFile.fileName);
    if (rel.startsWith("..")) return null;
    const dir = path.dirname(rel);
    const base = path.basename(rel).replace(/\.tsx?$/, "");
    const renamedBase = base.replace(/^index(?=$|\.)/, "init");
    return path.join(outDir, dir, `${renamedBase}.luau`);
}

function commonRoot(files: readonly string[]): string | undefined {
    if (files.length === 0) return undefined;
    const parts = files[0].split(path.sep);
    let root = parts.slice(0, parts.length - 1);
    for (const f of files.slice(1)) {
        const fp = f.split(path.sep);
        let i = 0;
        while (i < root.length && i < fp.length - 1 && root[i] === fp[i]) i++;
        root = root.slice(0, i);
    }
    return root.join(path.sep) || undefined;
}

type FileMeta = {
    outPath: string;
    strict: boolean;
    optimizeLevel: false | 0 | 1 | 2;
    annotate: boolean;
    verbose: boolean;
    sidecar: Map<string, FnDoc>;
    types: Map<string, FnTypes>;
};

const pending = new Map<string, FileMeta>();
const writingFiles = new Set<string>();
// dir path → watcher, shared across files in the same dir
const dirWatchers = new Map<string, fs.FSWatcher>();

function processFile(meta: FileMeta): void {
    try {
        formatFile(meta.outPath, meta.strict, meta.optimizeLevel, meta.sidecar, meta.annotate ? meta.types : new Map());
    } catch {
        // silently skip files that fail — they stay as-is
    }
}

function watchDir(dir: string): void {
    if (dirWatchers.has(dir)) return;
    try {
        const watcher = fs.watch(dir, { persistent: false }, (_event, filename) => {
            if (!filename) return;
            const outPath = path.join(dir, filename);
            const meta = pending.get(outPath);
            if (!meta) return;
            if (writingFiles.has(outPath)) return;
            pending.delete(outPath);
            writingFiles.add(outPath);
            try {
                processFile(meta);
            } finally {
                setTimeout(() => writingFiles.delete(outPath), 50).unref();
            }
            // clean up watcher if no more pending files in this dir
            const stillPending = [...pending.keys()].some(p => path.dirname(p) === dir);
            if (!stillPending) {
                watcher.close();
                dirWatchers.delete(dir);
            }
        });
        dirWatchers.set(dir, watcher);
    } catch {
        // dir may not exist yet — fall back to exit handler
    }
}

function flushPending(): void {
    for (const [, meta] of pending) {
        processFile(meta);
    }
    pending.clear();
    for (const [dir, watcher] of dirWatchers) {
        watcher.close();
        dirWatchers.delete(dir);
    }
}

function jsDocText(comment: ts.JSDoc["comment"]): string {
    if (!comment) return "";
    if (typeof comment === "string") return comment.trim().replace(/^—\s*/, "");
    const raw = (comment as ts.NodeArray<ts.JSDocComment>)
        .map(c => ("text" in c ? (c as { text: string }).text : ""))
        .join("");
    return raw.trim().replace(/^—\s*/, "");
}

function collectJsDoc(ts: typeof import("typescript"), sourceFile: ts.SourceFile): Map<string, FnDoc> {
    const sidecar = new Map<string, FnDoc>();

    function visit(node: ts.Node): void {
        if (ts.isFunctionDeclaration(node) && node.name) {
            const jsDocs = (node as { jsDoc?: ts.JSDoc[] }).jsDoc;
            if (jsDocs && jsDocs.length > 0) {
                const doc = jsDocs[jsDocs.length - 1];
                const rawDesc = jsDocText(doc.comment);
                const desc = rawDesc.split("\n").map(l => l.trim()).filter(Boolean);
                const params = new Map<string, string>();
                let returns = "";
                let deprecated: string | undefined;

                for (const tag of doc.tags ?? []) {
                    if (ts.isJSDocParameterTag(tag)) {
                        const name = ts.isIdentifier(tag.name) ? tag.name.text : "";
                        if (name) params.set(name, jsDocText(tag.comment).trim());
                    } else if (ts.isJSDocReturnTag(tag)) {
                        returns = jsDocText(tag.comment).trim();
                    } else if (ts.isJSDocDeprecatedTag(tag)) {
                        deprecated = jsDocText(tag.comment).trim();
                    }
                }

                if (desc.length > 0 || params.size > 0 || returns || deprecated !== undefined) {
                    sidecar.set(node.name.text, { desc, params, returns, deprecated });
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return sidecar;
}

export default function (
    program: ts.Program,
    config: PluginConfig = {},
): ts.TransformerFactory<ts.SourceFile> {
    const { strict = true, optimize = false, annotate = true, verbose = false } = config;
    const optimizeLevel: false | 0 | 1 | 2 = optimize === false ? false : ([0, 1, 2] as const).includes(optimize as 0|1|2) ? optimize : 2;

    // Safety net: flush any files that weren't caught by the dir watcher.
    // Also handles the last cycle when the process exits.
    process.on("exit", flushPending);

    const outDir = program.getCompilerOptions().outDir;
    const checker = annotate ? program.getTypeChecker() : null;

    return (_ctx) => (sourceFile) => {
        const outPath = outPathForSource(sourceFile, program);
        if (outPath) {
            const sidecar = collectJsDoc(ts, sourceFile);
            const types = checker ? collectTypes(checker, sourceFile) : new Map<string, FnTypes>();
            pending.set(outPath, { outPath, strict, optimizeLevel, annotate, verbose, sidecar, types });
            watchDir(path.dirname(outPath));
            if (verbose) {
                const rel = outDir ? path.relative(outDir, outPath) : outPath;
                console.log(`luau: ${rel}`);
            }
        }
        return sourceFile;
    };
}
