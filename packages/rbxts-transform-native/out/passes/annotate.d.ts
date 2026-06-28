import type ts from "typescript";
export type FnAnnotation = {
    params: Array<string | null>;
    paramNames: Array<string>;
    ret: string | null;
    exported: boolean;
};
export type FileSidecar = {
    fns: Map<string, FnAnnotation>;
    consts: Set<string>;
    native: boolean;
};
export declare function collectSidecar(ts: typeof import("typescript"), program: ts.Program, sourceFile: ts.SourceFile): FileSidecar;
export declare function generateDLuau(luauPath: string, sidecar: FileSidecar): void;
export declare function applyAnnotations(luauPath: string, sidecar: FileSidecar, injectTypes: boolean, dluau: boolean): void;
