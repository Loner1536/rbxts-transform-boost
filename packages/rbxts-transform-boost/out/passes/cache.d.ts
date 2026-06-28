import type ts from "typescript";
import type { Debugger } from "../debug";
export declare function cachePass(ts: typeof import("typescript"), program: ts.Program, ctx: ts.TransformationContext, sourceFile: ts.SourceFile, dbg: Debugger): {
    result: ts.SourceFile;
    cached: number;
};
