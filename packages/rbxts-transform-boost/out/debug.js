"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDebugger = createDebugger;
function createDebugger(_program, verboseEnabled) {
    const pendingFnInfos = [];
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
            const parts = [];
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
