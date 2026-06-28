export interface PluginConfig {
    // Hoist repeated game:GetService() calls to file-level locals and hoist
    // repeated property access chains within functions to locals.
    // Default: true
    hoist?: boolean;

    // Print per-file hoisting stats to the console during compilation.
    // Default: false
    verbose?: boolean;
}
