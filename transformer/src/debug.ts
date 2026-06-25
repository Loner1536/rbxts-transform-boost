import type ts from "typescript";

type Compiler = "roblox-ts" | "rotor";

function detectCompiler(): Compiler {
    for (const arg of process.argv) {
        if (arg.includes("rotor")) return "rotor";
    }
    const script = process.env.npm_lifecycle_script ?? process.env._ ?? "";
    if (script.includes("rotor")) return "rotor";
    return "roblox-ts";
}

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const GRAY = "\x1b[90m";

function fmtStats(stats: FileStats, sep: string): string {
    const parts: string[] = [];
    if (stats.cached) parts.push(`${stats.cached} hoisted`);
    if (stats.annotated) parts.push(`${stats.annotated} annotated`);
    if (stats.promoted) parts.push(`${stats.promoted} promoted`);
    return parts.join(sep);
}

export type FileStats = {
    cached?: number;
    annotated?: number;
    promoted?: number;
};

export type Debugger = {
    enabled: boolean;
    compiler: Compiler;
    file(file: string, stats: FileStats, ms?: number): void;
    warn(pass: string, msg: string): void;
    error(pass: string, msg: string): void;
};

export function createDebugger(_program: ts.Program, verbose: boolean): Debugger {
    const compiler = detectCompiler();
    const rotor = compiler === "rotor";

    const totals = { files: 0, cached: 0, annotated: 0, promoted: 0 };
    let summaryRegistered = false;
    let firstVerboseLine = true;

    function emit(line: string) {
        if (line) process.stderr.write(line + "\n");
    }

    function registerSummary() {
        if (summaryRegistered) return;
        summaryRegistered = true;
    }

    return {
        enabled: verbose,
        compiler,

        file(file, stats, ms?) {
            totals.files++;
            totals.cached += stats.cached ?? 0;
            totals.annotated += stats.annotated ?? 0;
            totals.promoted += stats.promoted ?? 0;

            if (rotor) registerSummary();

            if (!verbose) return;

            // roblox-ts: break cleanly off "running transformers.." on first line only
            if (!rotor && firstVerboseLine) {
                firstVerboseLine = false;
                process.stderr.write("\n");
            }

            const detail = fmtStats(stats, ", ");
            const statStr = detail ? ` ( ${detail} )` : "";
            const msStr = ms !== undefined ? ` ( ${ms} ms )` : "";
            emit(`running boost: ${file}${statStr}${msStr}`);
        },

        warn(pass, msg) {
            if (!verbose && !rotor) return;
            if (rotor) {
                emit(`  ${YELLOW}⚠${RESET}  boost: ${GRAY}${pass}${RESET}: ${msg}`);
            } else {
                emit(`${YELLOW}[boost] warn${RESET} ${GRAY}${pass}${RESET}: ${msg}`);
            }
        },

        error(pass, msg) {
            if (rotor) {
                emit(`  ${RED}✖${RESET}  boost: ${GRAY}${pass}${RESET}: ${msg}`);
            } else {
                emit(`${RED}[boost] error${RESET} ${GRAY}${pass}${RESET}: ${msg}`);
            }
        },
    };
}
