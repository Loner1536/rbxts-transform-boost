# Lemon Signal

Typings for [Lemon Signal](https://github.com/Data-Oriented-House/LemonSignal).

A pure Luau signal implementation faster than most other implementations in Roblox.

## [Documentation](https://data-oriented-house.github.io/LemonSignal/)

## Roblox-ts Typings

This signal supports tuple/callback/value typings.

```ts
// callback
const signal = new Signal<(foo: string) => void>();
// tuple
const signal = new Signal<[foo: string]>();
// value
const signal = new Signal<string>(); // single value only
// empty
const signal = new Signal(); // Signal<() => void>

signal.Fire("");
signal.Connect((foo) => {
	print(foo);
});
```

## Roblox-ts deviation:

-   added `Signal.is` for checking if a value is a signal
