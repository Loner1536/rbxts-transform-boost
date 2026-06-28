# rbxts-transform-luau

A [roblox-ts](https://roblox-ts.com) / [rotor](https://github.com/roblox-ts/rotor) TypeScript transformer that makes compiled Luau output idiomatic — cleaning up noise, organizing the preamble, converting JSDoc comments, and injecting Luau directives.

## What it does

### Luau directives

Injects `--!strict` and/or `--!optimize N` at the top of every file.

```luau
--!native
--!optimize 2
--!strict
```

### Preamble organization

Sorts the top of every file into labeled sections: directives → services → runtime → imports → bindings. Makes the compiled output readable at a glance.

```luau
--!optimize 2
--!strict

-- Compiled with rotor v2.2.0

-- Services
const _ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Runtime
const TS = require(_ReplicatedStorage:WaitForChild("include"):WaitForChild("RuntimeLib"))

-- Imports
local fns; if false then fns = require(...) else fns = TS.import(...) :: any end
```

### TS.import type hints

Wraps `TS.import` calls with a dead-code `require` branch so luau-lsp can infer the module's return type — zero runtime cost.

```luau
-- luau-lsp gets full autocomplete through the require branch
local fns; if false then fns = require(_ReplicatedStorage.shared.fns) else fns = TS.import(script, _ReplicatedStorage, "shared", "fns") :: any end
```

### JSDoc → Luau doc comment conversion

Block comments emitted by roblox-ts/rotor that contain JSDoc tags are converted to luau-lsp doc comments (`---`) with inferred Luau types from the function signature.

```luau
-- Before (rotor output)
--[[
 *
 * Computes the dot product.
 * @param a first vector
 * @param b second vector
 * @returns scalar result
 
]]
local function dot(a: Vector3, b: Vector3): number

-- After
--- Computes the dot product.
---@param a Vector3 — first vector
---@param b Vector3 — second vector
---@return number — scalar result
local function dot(a: Vector3, b: Vector3): number
```

### Comment cleanup

Strips useless block comments (`--[[ ]]`) that roblox-ts emits for non-function declarations where no useful information can be extracted.

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
        "optimize": 2
      }
    ]
  }
}
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `strict` | `boolean` | `false` | Inject `--!strict` at the top of every file |
| `optimize` | `false \| 0 \| 1 \| 2` | `false` | Inject `--!optimize N` (`false` disables, `0`/`1`/`2` set the level) |
| `verbose` | `boolean` | `false` | Log per-file processing info to the console |
