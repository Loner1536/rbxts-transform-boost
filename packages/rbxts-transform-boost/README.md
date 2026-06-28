# rbxts-transform-boost

A [roblox-ts](https://roblox-ts.com) / [rotor](https://github.com/roblox-ts/rotor) TypeScript transformer that improves compiled Luau performance by hoisting repeated expressions and caching property chains.

## What it does

### GetService hoisting

`game:GetService("X")` calls used two or more times in a file are hoisted to a top-level local so the lookup only happens once.

```typescript
// Input
function a() { return game.GetService("RunService").Heartbeat }
function b() { return game.GetService("RunService").IsRunning }
```

```luau
-- Output
const _RunService = game:GetService("RunService")

local function a() return _RunService.Heartbeat end
local function b() return _RunService.IsRunning end
```

### Property chain caching

Repeated property accesses (e.g. `workspace.CurrentCamera.CFrame`) inside loops or hot functions are cached into a local so the engine only walks the chain once.

```typescript
// Input
for (let i = 0; i < n; i++) {
    const pos = workspace.CurrentCamera.CFrame.Position
}
```

```luau
-- Output
const _CFrame = workspace.CurrentCamera.CFrame
for i = 0, n - 1 do
    const pos = _CFrame.Position
end
```

### Loop bounds hoisting

Upper bounds that are non-trivial expressions are extracted to a local so they are not re-evaluated on every iteration.

```luau
-- Before
for i = 0, someTable:size() - 1 do

-- After
const _size = someTable:size()
for i = 0, _size - 1 do
```

## Benchmarks

Measured in Roblox Studio server context, 100,000 iterations per benchmark (10,000 for CFrame constructors). Both suites use `//!native`. Compiled with roblox-ts.

**With transformer** = GetService hoisting + property chain caching + `--!strict` + `--!optimize 2` + type annotations  
**Without transformer** = raw roblox-ts output (`//!native` only)

### GetService hoisting

| Benchmark | With | Without | Speedup |
|---|---|---|---|
| svc ×1 (baseline) | 0.158 µs | 0.432 µs | **2.7×** |
| svc ×2 (same service) | 0.276 µs | 0.686 µs | **2.5×** |
| svc ×3 (diff services) | 0.459 µs | 1.103 µs | **2.4×** |

### Property chain caching

| Benchmark | With | Without | Speedup |
|---|---|---|---|
| cam.CFrame ×3 | 0.854 µs | 0.761 µs | — |
| cam.CFrame.Position ×3 | 0.771 µs | 1.425 µs | **1.8×** |

### Vector3 field hoisting

| Benchmark | With | Without | Speedup |
|---|---|---|---|
| dot (×1 each field, control) | 0.082 µs | 0.166 µs | **2.0×** |
| cross (×2 each field) | 0.082 µs | 0.212 µs | **2.6×** |
| lerp (×2 each field) | 0.081 µs | 0.191 µs | **2.4×** |
| integrate (method calls) | 0.083 µs | 0.124 µs | **1.5×** |

## Installation

```bash
npm install --save-dev rbxts-transform-boost
```

## Setup

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "rbxts-transform-boost",
        "hoist": true
      }
    ]
  }
}
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `hoist` | `boolean` | `true` | Enable GetService hoisting, property chain caching, and loop bounds hoisting |
| `verbose` | `boolean` | `false` | Log per-file stats to the console |
