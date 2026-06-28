export interface PluginConfig {
    // Inject Luau type annotations into emitted function signatures wherever
    // TypeScript types can be mapped to known Luau types.
    // Default: true
    types?: boolean;

    // Generate a .d.luau type declaration file alongside each emitted .luau file,
    // declaring types for exported functions so pure Luau consumers get autocomplete.
    // Default: false
    dluau?: boolean;

    // Print per-file processing info to the console during compilation.
    // Default: false
    verbose?: boolean;
}
