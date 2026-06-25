# @rbxts/diff

[![CI Status](https://github.com/R-unic/diff/actions/workflows/test.yml/badge.svg)](https://github.com/R-unic/diff/actions/workflows)
[![Coverage Status](https://coveralls.io/repos/github/R-unic/diff/badge.svg?branch=master)](https://coveralls.io/github/R-unic/diff)

Calculate diffs between objects and apply diffs to objects

## Example

```ts
import { createDiff, applyDiff } from "@rbxts/diff";

interface Foo {
  readonly blah?: string;
  readonly bar: {
    readonly baz: number;
  };
}

const a: Foo = { blah: "yas", bar: { baz: 420 } };
const b: Foo = { bar: { baz: 69 } };
const diff = createDiff(a, b);
print(diff) // { changed = { bar = { baz = 69 } }, removed = { blah = true } }

const newObject = applyDiff(a, diff); // this will turn a into b
print(newObject) // { bar = { baz = 69 } }
```
