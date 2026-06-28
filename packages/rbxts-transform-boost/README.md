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

Measured on a **live Roblox server** (published baseplate), 100,000 iterations per benchmark (10,000 for CFrame constructors). Both suites use `//!native`. Compiled with roblox-ts.

**With transformer** = GetService hoisting + property chain caching + `--!strict` + `--!optimize 2` + type annotations (via `rbxts-transform-luau`)
**Without transformer** = raw roblox-ts output (`//!native` only)

You can run the benchmark yourself: [Boost Transformer Bench](https://www.roblox.com/games/125084893596995/Boost-Transformer-Bench)

### GetService hoisting

| Benchmark | With | Without | Speedup |
|---|---|---|---|
| svc ×1 (baseline) | 0.112 µs | 0.320 µs | **2.9×** |
| svc ×2 (same service) | 0.198 µs | 0.614 µs | **3.1×** |
| svc ×3 (diff services) | 0.301 µs | 0.878 µs | **2.9×** |

### Property chain caching

| Benchmark | With | Without | Speedup |
|---|---|---|---|
| cam.CFrame ×3 | 0.454 µs | 0.494 µs | 1.1× |
| cam.CFrame.Position ×3 | 0.443 µs | 0.885 µs | **2.0×** |

### Vector3 field hoisting

| Benchmark | With | Without | Speedup |
|---|---|---|---|
| dot (×1 each field) | 0.062 µs | 0.099 µs | **1.6×** |
| cross (×2 each field) | 0.057 µs | 0.151 µs | **2.6×** |
| lerp (×2 each field) | 0.054 µs | 0.126 µs | **2.3×** |
| integrate (method calls) | 0.056 µs | 0.075 µs | 1.3× |

### Loop bounds hoisting

| Benchmark | With | Without | Speedup |
|---|---|---|---|
| sumArray (size ×1) | 0.120 µs | 0.106 µs | — |
| weightedSum (size ×1) | 0.135 µs | 0.116 µs | — |

### CFrame

| Benchmark | With | Without | Speedup |
|---|---|---|---|
| cfLookAt (ctor) | 0.146 µs | 0.142 µs | — |
| cfChain (mul+angles) | 0.158 µs | 0.160 µs | — |

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
