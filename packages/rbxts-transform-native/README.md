# rbxts-transform-native

A [roblox-ts](https://roblox-ts.com) / [rotor](https://github.com/grilme99/rotor) TypeScript transformer that enables `--!native` compilation and injects Luau type annotations into emitted function signatures wherever TypeScript types map to known Luau types.

## What it does

### `--!native` injection

Add `//!native` as the first line of any TypeScript file to have `--!native` injected at the top of the compiled Luau output. This opts the entire file into Luau's native code generation, which can significantly improve performance for math-heavy code.

```typescript
//!native

export function integrate(pos: Vector3, vel: Vector3, acc: Vector3, dt: number) {
  // ...
}
```

```luau
--!native

local function integrate(pos: Vector3, vel: Vector3, acc: Vector3, dt: number): (Vector3, Vector3)
  -- ...
end
```

### Luau type annotation injection

TypeScript types that map to known Luau types are injected into compiled function signatures. This lets the Luau type checker and luau-lsp understand your compiled code without any manual annotation.

**Supported types:** `number`, `string`, `boolean`, `void`, `Vector3`, `Vector2`, `CFrame`, `Color3`, `UDim2`, `buffer`, `Instance`, `BasePart`, `Part`, `Model`, `Player`, `Camera`, `RunService`, `Players`, arrays (`T[]` → `{T}`), and tuples (`[T, U]` → `(T, U)`).

```typescript
export function dot(a: Vector3, b: Vector3): number {
  return a.X * b.X + a.Y * b.Y + a.Z * b.Z
}
```

```luau
-- Before (roblox-ts/rotor default output)
local function dot(a, b)

-- After (with rbxts-transform-native)
local function dot(a: Vector3, b: Vector3): number
```

### `const` promotion

Variables declared with `const` in TypeScript that remain unmutated in the compiled output are promoted from `local` to Luau `const`, enabling VM read-only optimisations.

### `.d.luau` declaration files

When `dluau: true` is set, a `.d.luau` type declaration file is generated alongside each compiled `.luau` file, listing the types of all exported functions. Useful for pure Luau consumers of a compiled package.

```luau
-- fns.d.luau (generated)
export type integrate = (pos: Vector3, vel: Vector3, acc: Vector3, dt: number) -> (Vector3, Vector3)
export type dot = (a: Vector3, b: Vector3) -> number

export type Module = {
    integrate: integrate,
    dot: dot,
}
```

## Installation

```bash
npm install --save-dev rbxts-transform-native
# or
yarn add -D rbxts-transform-native
```

## Setup

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "rbxts-transform-native",
        "types": true
      }
    ]
  }
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `types` | `boolean` | `true` | Inject Luau type annotations into compiled function signatures |
| `dluau` | `boolean` | `false` | Generate `.d.luau` type declaration files alongside each `.luau` output |
| `verbose` | `boolean` | `false` | Log per-file processing info to the console |

## Usage

Mark a file for native compilation by adding `//!native` as the very first line:

```typescript
//!native

export function fib(n: number): number {
  let a = 0, b = 1
  for (let i = 0; i < n; i++) {
    [a, b] = [b, a + b]
  }
  return a
}
```

The transformer will:
1. Inject `--!native` at the top of the compiled `.luau` file
2. Annotate `fib`'s signature: `local function fib(n: number): number`

## Recommended stack

This transformer is designed to be used alongside:

- [`rbxts-transform-boost`](https://www.npmjs.com/package/rbxts-transform-boost) — GetService and property chain hoisting
- [`rbxts-transform-luau`](https://www.npmjs.com/package/rbxts-transform-luau) — idiomatic Luau output formatting

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
