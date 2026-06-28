# rbxts-transform-native

A [roblox-ts](https://roblox-ts.com) / [rotor](https://github.com/roblox-ts/rotor) TypeScript transformer that injects Luau type annotations into compiled function signatures for files marked `//!native`.

## What it does

Files with `//!native` as the first line are opted into Luau's native code generation. This transformer reads the TypeScript types of every exported function in those files and annotates the compiled Luau signatures — letting the native compiler make stronger type assumptions and significantly improving performance.

```typescript
//!native

export function dot(a: Vector3, b: Vector3): number {
    return a.X * b.X + a.Y * b.Y + a.Z * b.Z
}

export function clamp(x: number, min: number, max: number): number {
    return math.clamp(x, min, max)
}
```

```luau
--!native

local function dot(a: Vector3, b: Vector3): number
    ...
end

local function clamp(x: number, min: number, max: number): number
    ...
end
```

Files without `//!native` are ignored entirely.

## Supported types

Primitive: `number`, `string`, `boolean`, `void` → `()`

Math types: `Vector3`, `Vector2`, `Vector2int16`, `Vector3int16`, `CFrame`, `UDim`, `UDim2`, `Color3`, `BrickColor`, `TweenInfo`, `NumberRange`, `NumberSequence`, `ColorSequence`, `Rect`, `Region3`, `Ray`

Other: `buffer`, `Instance`, `BasePart`, `Part`, `Model`, `Player`, `Camera`, `Workspace`, `RunService`, `Players`

Arrays: `T[]` or `Array<T>` → `{T}`

Tuples: `LuaTuple<[T, U]>` → `(T, U)` (multi-return)

Types not in the list above are left unannotated.

## Installation

```bash
npm install --save-dev rbxts-transform-native
```

## Setup

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "rbxts-transform-native"
      }
    ]
  }
}
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `verbose` | `boolean` | `false` | Log per-file info (file path, function count) to the console |

## Usage

Add `//!native` as the very first line of any TypeScript file you want native-compiled:

```typescript
//!native

export function integrate(pos: Vector3, vel: Vector3, acc: Vector3, dt: number): LuaTuple<[Vector3, Vector3]> {
    const newVel = new Vector3(vel.X + acc.X * dt, vel.Y + acc.Y * dt, vel.Z + acc.Z * dt)
    const newPos = new Vector3(pos.X + newVel.X * dt, pos.Y + newVel.Y * dt, pos.Z + newVel.Z * dt)
    return $tuple(newPos, newVel)
}
```

rotor/roblox-ts preserves `//!native` as `--!native` in the Luau output. This transformer then annotates the function signatures with Luau types derived from the TypeScript source.
