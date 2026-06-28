# rbxts-transform-luau

A [roblox-ts](https://roblox-ts.com) / [rotor](https://github.com/roblox-ts/rotor) TypeScript transformer that makes compiled Luau output idiomatic — cleaning up noise, organizing the preamble, injecting Luau directives, annotating types, and converting JSDoc comments.

## What it does

### Luau directives

Injects `--!strict` and/or `--!optimize N` at the top of every file.

```luau
--!native
--!optimize 2
--!strict
```

### Preamble organization

Sorts the top of every file into labeled sections: directives → services → runtime → imports. Makes the compiled output readable at a glance.

```luau
--!optimize 2
--!strict

-- Compiled with roblox-ts v3.0.0

-- Services
const _ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Runtime
const TS = require(_ReplicatedStorage:WaitForChild("include"):WaitForChild("RuntimeLib"))

-- Imports
const fns; if false then fns = require(...) else fns = TS.import(...) :: any end
```

### `const` promotion

Locals and imports that are never reassigned anywhere in the file are promoted to `const`, allowing the Luau native compiler to make stronger assumptions.

```luau
-- Before
local N = 100000
local function compute()
    local scale = 0.5
    local result = scale * N
local base; if false then base = require(...) else base = TS.import(...) :: any end

-- After
const N = 100000
local function compute()
    const scale = 0.5
    const result = scale * N
const base; if false then base = require(...) else base = TS.import(...) :: any end
```

Variables that are mutated (`i += 1`, reassignment, etc.) are correctly left as `local`.

### Luau type annotations

Uses the TypeScript type checker to inject Luau type annotations into every function signature — covering inferred types that have no explicit annotation in source.

```typescript
// Input — types inferred by TypeScript, not explicitly written
export function dot(a: Vector3, b: Vector3) {
    return a.X * b.X + a.Y * b.Y + a.Z * b.Z
}
export function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}
```

```luau
-- Output — type checker resolved them; luau-lsp now sees them too
local function dot(a: Vector3, b: Vector3): number
local function lerp(a: number, b: number, t: number): number
```

Supports: primitives (`number`, `string`, `boolean`), Roblox value types (`Vector3`, `CFrame`, `UDim2`, etc.), arrays (`{T}`), and `LuaTuple<[T, U]>` → multi-return `(T, U)`.

Set `annotate: false` to disable.

### TS.import type hints

Wraps `TS.import` calls with a dead-code `require` branch so luau-lsp can infer the module's return type — zero runtime cost.

```luau
-- luau-lsp gets full autocomplete and types through the require branch
const fns; if false then fns = require(_ReplicatedStorage.shared.fns) else fns = TS.import(script, _ReplicatedStorage, "shared", "fns") :: any end
```

### JSDoc → Luau doc comments

TypeScript JSDoc (`@param`, `@returns`, `@deprecated`) is converted to luau-lsp doc comment format with inferred Luau types. Works with both roblox-ts and rotor.

```typescript
/**
 * Computes the dot product of two vectors.
 * @param a First vector.
 * @param b Second vector.
 * @returns Scalar result.
 */
export function dot(a: Vector3, b: Vector3): number { ... }

/** @deprecated Use dot() instead. */
export function oldDot(a: Vector3, b: Vector3): number { ... }
```

```luau
--- Computes the dot product of two vectors.
--- @param a Vector3 First vector.
--- @param b Vector3 Second vector.
--- @return number Scalar result.
local function dot(a: Vector3, b: Vector3): number

--- @deprecated Use dot() instead.
local function oldDot(a: Vector3, b: Vector3): number
```

### Comment cleanup

Strips useless block comments (`--[[ ]]`) that compilers emit for non-function declarations where no useful information can be extracted.

## Installation

```bash
npm install --save-dev rbxts-transform-luau
```

## Setup

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "rbxts-transform-luau",
        "strict": true,
        "optimize": 2,
        "annotate": true
      }
    ]
  }
}
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `strict` | `boolean` | `true` | Inject `--!strict` at the top of every file |
| `optimize` | `false \| 0 \| 1 \| 2` | `false` | Inject `--!optimize N` (`false` disables, `0`/`1`/`2` set the level) |
| `annotate` | `boolean` | `true` | Inject Luau type annotations using the TypeScript type checker |
| `verbose` | `boolean` | `false` | Log per-file processing info to the console |
