import type ts from "typescript";

export interface FunctionHoistInfo {
    fnName: string;
    hoisted: string[];
    mutableSkips: string[];
}

export interface Debugger {
    hoistInfo(info: FunctionHoistInfo): void;
    file(rel: string, stats: { cached: number; errors: string[] }): void;
    warn(pass: string, message: string): void;
    error(pass: string, message: string): void;
}

export function createDebugger(_program: ts.Program, verboseEnabled: boolean): Debugger {
    const pendingFnInfos: FunctionHoistInfo[] = [];

    return {
        hoistInfo(info) {
            pendingFnInfos.push(info);
        },

        file(rel, { cached, errors }) {
            const fnInfos = pendingFnInfos.splice(0);

            if (cached === 0 && errors.length === 0) {
                console.log(`boost: ${rel}`);
                return;
            }

            const parts: string[] = [];

            if (cached > 0) {
                parts.push(`${cached} hoisted`);

                if (verboseEnabled && fnInfos.length > 0) {
                    const fnParts = fnInfos.map(info => {
                        const chains = info.hoisted.join(", ");
                        const label = info.fnName === "<anonymous>"
                            ? `<anon:${info.hoisted[0]?.split(".").pop() ?? "?"}>`
                            : info.fnName;
                        const mutPart = info.mutableSkips.length > 0
                            ? ` [mut: ${info.mutableSkips.join(", ")}]`
                            : "";
                        return `${label}: ${chains}${mutPart}`;
                    });
                    parts.push(`(${fnParts.join(" | ")})`);
                }
            }

            if (errors.length > 0) {
                parts.push(`${errors.length} error${errors.length > 1 ? "s" : ""}: ${errors.join(", ")}`);
            }

            console.log(`boost: ${rel} — ${parts.join("  ")}`);
        },

        warn(pass, message) {
            console.warn(`[boost:${pass}] warn: ${message}`);
        },

        error(pass, message) {
            console.error(`[boost] error ${pass}: ${message}`);
        },
    };
}
