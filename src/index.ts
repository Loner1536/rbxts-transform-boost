import type ts from "typescript";
import type { PluginConfig } from "./config";
import { nativePass } from "./passes/native";
import { cachePass } from "./passes/cache";
import { annotatePass } from "./passes/annotate";
import { createDebugger } from "./debug";

export type { PluginConfig };


export default function (
    program: ts.Program,
    config: PluginConfig = {},
    { ts }: { ts: typeof import("typescript") },
): ts.TransformerFactory<ts.SourceFile> {
    const { optimize = true, strict = true, hoist = true, verbose = false } = config;
    const dbg = createDebugger(program, verbose);

    return (ctx) => (sourceFile) => {
        if (sourceFile.fileName.endsWith("fns-bare.ts")) return sourceFile;

        const rel = sourceFile.fileName.replace(process.cwd() + "/", "");

        annotatePass(ts, program, sourceFile);
        let result = sourceFile;
        if (hoist) result = cachePass(ts, program, ctx, result);
        if (optimize || strict) result = nativePass(ts, ctx, result, optimize, strict);

        dbg.file(rel, { /* populate from pass return values */ });
        return result;
    };
}
