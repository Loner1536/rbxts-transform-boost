# rbxts-transform-luau

A [roblox-ts](https://roblox-ts.com) / [rotor](https://github.com/grilme99/rotor) TypeScript transformer that makes compiled Luau output idiomatic and readable — cleaning up noise, organizing the preamble, promoting constants, and injecting Luau directives.

## What it does

### Preamble organization

Sorts the top of every file into clearly labeled sections: directives, services, runtime, imports, bindings.

```luau
--!optimize 2
--!strict

-- Compiled with rotor v2.2.0

-- Services
const _ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Runtime
const TS = require(_ReplicatedStorage:WaitForChild("include"):WaitForChild("RuntimeLib"))

-- Imports
local fns; if false then fns = require(_ReplicatedStorage.shared.fns) else fns = TS.import(script, _ReplicatedStorage, "shared", "fns") :: any end
```

### TS.import type hints

Wraps `TS.import` calls with a dead-code `require` branch so luau-lsp can infer the module's return type and provide autocomplete — with zero runtime cost.

```luau
-- TS.import with full type inference for luau-lsp
local fns; if false then fns = require(_ReplicatedStorage.shared.fns) else fns = TS.import(script, _ReplicatedStorage, "shared", "fns") :: any end
```

### `const` promotion

Top-level locals that are never reassigned are promoted to `const` so the Luau VM can apply read-only optimisations.

```luau
-- local → const when never reassigned
const N = 100000
const pos = Vector3.new(1, 2, 3)
```

### Comment cleanup

Strips useless JSDoc block comments (`@param`, `@returns`, etc.) that roblox-ts emits but serve no purpose in Luau output.

### Luau directives

Injects `--!strict` and `--!optimize N` at the top of every file.

## Installation

```bash
npm install --save-dev rbxts-transform-luau
# or
yarn add -D rbxts-transform-luau
```

## Setup

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "rbxts-transform-luau",
        "strict": true,
        "optimize": true,
        "optimizeLevel": 2
      }
    ]
  }
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strict` | `boolean` | `false` | Inject `--!strict` at the top of every file |
| `optimize` | `boolean` | `false` | Inject `--!optimize N` at the top of every file |
| `optimizeLevel` | `0 \| 1 \| 2` | `1` | Optimization level (requires `optimize: true`) |
| `verbose` | `boolean` | `false` | Log per-file processing info to the console |

## Recommended stack

This transformer is designed to be used alongside:

- [`rbxts-transform-boost`](https://www.npmjs.com/package/rbxts-transform-boost) — GetService and property chain hoisting
- [`rbxts-transform-native`](https://www.npmjs.com/package/rbxts-transform-native) — `--!native` injection and Luau type annotations

```json
{
  "compilerOptions": {
    "plugins": [
      { "transform": "rbxts-transform-boost", "hoist": true },
      { "transform": "rbxts-transform-luau", "strict": true, "optimize": true, "optimizeLevel": 2 },
      { "transform": "rbxts-transform-native", "types": true }
    ]
  }
}
```

> **Order matters.** Run `rbxts-transform-boost` first, then `rbxts-transform-luau`, then `rbxts-transform-native`.
