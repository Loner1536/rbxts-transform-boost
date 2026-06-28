import type ts from "typescript";
export interface FunctionHoistInfo {
    fnName: string;
    hoisted: string[];
    mutableSkips: string[];
}
export interface Debugger {
    hoistInfo(info: FunctionHoistInfo): void;
    file(rel: string, stats: {
        cached: number;
        errors: string[];
    }): void;
    warn(pass: string, message: string): void;
    error(pass: string, message: string): void;
}
export declare function createDebugger(_program: ts.Program, verboseEnabled: boolean): Debugger;
