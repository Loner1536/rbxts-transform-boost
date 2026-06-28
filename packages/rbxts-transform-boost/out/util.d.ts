import type ts from "typescript";
export declare function chainKey(ts: typeof import("typescript"), node: ts.Expression): string | undefined;
export declare function walk(ts: typeof import("typescript"), node: ts.Node, visitor: (n: ts.Node) => void): void;
export declare function walkShallow(ts: typeof import("typescript"), node: ts.Node, visitor: (n: ts.Node) => void): void;
export declare function isAssignmentTarget(ts: typeof import("typescript"), node: ts.Node): boolean;
