# rbxts-transforms

A collection of TypeScript transformer plugins for [roblox-ts](https://roblox-ts.com/) / [rotor](https://github.com/roblox-ts/rotor) that improve and clean up compiled Luau output at build time — no runtime cost.

## Packages

| Package | npm | Description |
|---|---|---|
| [`rbxts-transform-boost`](packages/rbxts-transform-boost) | [![npm](https://img.shields.io/npm/v/rbxts-transform-boost)](https://www.npmjs.com/package/rbxts-transform-boost) | GetService hoisting, property chain caching, loop bounds hoisting, `const` promotion |
| [`rbxts-transform-luau`](packages/rbxts-transform-luau) | [![npm](https://img.shields.io/npm/v/rbxts-transform-luau)](https://www.npmjs.com/package/rbxts-transform-luau) | Preamble formatting, TS.import type hints, JSDoc conversion, comment cleanup, `--!strict`/`--!optimize` |
| [`rbxts-transform-native`](packages/rbxts-transform-native) | [![npm](https://img.shields.io/npm/v/rbxts-transform-native)](https://www.npmjs.com/package/rbxts-transform-native) | Luau type annotations for `//!native` files |

Each package is independent — use any combination, in any order.

---

## Quick start

Install whichever packages you need:

```bash
npm install --save-dev rbxts-transform-boost rbxts-transform-luau rbxts-transform-native
```

Add them to your `tsconfig.json` plugins:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "rbxts-transform-boost",
        "hoist": true
      },
      {
        "transform": "rbxts-transform-luau",
        "strict": true,
        "optimize": 2
      },
      {
        "transform": "rbxts-transform-native",
        "verbose": true
      }
    ]
  }
}
```

---

## Benchmarks

Measured in Roblox Studio server context. 100,000 iterations per benchmark. All suites use `//!native`.

| Benchmark | With | Without | Speedup | Driver |
|---|---|---|---|---|
| integrate (Verlet) | 0.058 µs | 0.071 µs | **1.2×** | type annotations |
| dot (V3 manual) | 0.025 µs | 0.046 µs | **1.8×** | type annotations |
| cross (V3 manual) | 0.024 µs | 0.072 µs | **3.0×** | 6× field hoisting + types |
| lerpVec3 (V3 manual) | 0.026 µs | 0.061 µs | **2.3×** | 3× field hoisting + types |
| serviceWork (GetService ×2) | 0.243 µs | 0.481 µs | **2.0×** | GetService hoisting |
| multiSvc (GetService ×3) | 0.154 µs | 0.505 µs | **3.3×** | GetService hoisting |
| cameraWork (prop chain) | 0.185 µs | 0.218 µs | **1.2×** | `camera.CFrame` hoisted |

---

## Development

```bash
bun install           # install all workspace dependencies
bun run build         # build all three packages
bun run bench:rotor   # compile bench/ with rotor
bun run bench:roblox-ts  # compile bench/ with roblox-ts
```
