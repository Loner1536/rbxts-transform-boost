export interface PluginConfig {
    // Prepend --!strict to every emitted file that doesn't already have it.
    // Default: true
    strict?: boolean;

    // Prepend --!optimize <level> to every emitted file.
    // Default: false
    optimize?: boolean;

    // The optimization level for --!optimize. Valid values: 0, 1, 2.
    // Default: 2
    optimizeLevel?: 0 | 1 | 2;

    // Print per-file processing info to the console during compilation.
    // Default: false
    verbose?: boolean;
}
