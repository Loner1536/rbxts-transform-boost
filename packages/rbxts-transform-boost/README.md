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

Measured in Roblox Studio server context, 100,000 iterations per benchmark. Both suites use `//!native`. Compiled with roblox-ts.

| Benchmark | With | Without | Speedup | Driver |
|---|---|---|---|---|
| integrate (verlet) | 0.084 µs | 0.171 µs | **2.0×** | Vector3 field hoisting |
| dot (V3 manual) | 0.082 µs | 0.192 µs | **2.3×** | Vector3 field hoisting |
| cross (V3 manual) | 0.089 µs | 0.256 µs | **2.9×** | Vector3 field hoisting |
| lerpVec3 (V3 manual) | 0.081 µs | 0.217 µs | **2.7×** | Vector3 field hoisting |
| serviceWork (GetService ×2) | 0.450 µs | 0.905 µs | **2.0×** | GetService hoisting |
| multiSvc (GetService ×3) | 0.405 µs | 1.062 µs | **2.6×** | GetService hoisting |

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
