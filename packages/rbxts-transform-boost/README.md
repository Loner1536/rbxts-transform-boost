# rbxts-transform-boost

A [roblox-ts](https://roblox-ts.com) / [rotor](https://github.com/grilme99/rotor) TypeScript transformer that improves the runtime performance of compiled Luau output by hoisting repeated expressions out of hot paths.

## What it does

### GetService hoisting

`game:GetService("X")` calls that appear two or more times in a file are hoisted to a top-level local so the lookup happens once.

```typescript
// Input
function a() { return game.GetService("RunService").Heartbeat }
function b() { return game.GetService("RunService").IsRunning }
```

```luau
-- Output
local _RunService = game:GetService("RunService")

local function a() return _RunService.Heartbeat end
local function b() return _RunService.IsRunning end
```

### Property chain caching

Repeated property chains (e.g. `workspace.CurrentCamera.CFrame`) inside loops or hot functions are cached into locals so the engine only walks the chain once.

```typescript
// Input
for (let i = 0; i < n; i++) {
  const pos = workspace.CurrentCamera.CFrame.Position
}
```

```luau
-- Output
local function loop(n)
  local _CFrame = workspace.CurrentCamera.CFrame
  for i = 0, n - 1 do
    local pos = _CFrame.Position
  end
end
```

### Loop bounds hoisting

Upper bounds of `for` loops that are non-trivial expressions are hoisted to a local so they are not re-evaluated on every iteration.

## Installation

```bash
npm install --save-dev rbxts-transform-boost
# or
yarn add -D rbxts-transform-boost
```

## Setup

Add to your `tsconfig.json`:

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
|--------|------|---------|-------------|
| `hoist` | `boolean` | `true` | Enable GetService and property chain hoisting |
| `verbose` | `boolean` | `false` | Log per-file processing info to the console |

## Recommended stack

This transformer is designed to be used alongside:

- [`rbxts-transform-luau`](https://www.npmjs.com/package/rbxts-transform-luau) — idiomatic Luau output formatting
- [`rbxts-transform-native`](https://www.npmjs.com/package/rbxts-transform-native) — `--!native` injection and Luau type annotations

```json
{
  "compilerOptions": {
    "plugins": [
      { "transform": "rbxts-transform-boost", "hoist": true },
      { "transform": "rbxts-transform-luau", "strict": true, "optimize": true },
      { "transform": "rbxts-transform-native", "types": true }
    ]
  }
}
```

> **Order matters.** Run `rbxts-transform-boost` first, then `rbxts-transform-luau`, then `rbxts-transform-native`.
