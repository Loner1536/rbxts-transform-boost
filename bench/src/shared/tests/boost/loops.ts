// Tests: loop bounds hoisting
// Expected: arr.size() in for-loop upper bound is hoisted to a local

// Simple: size() in upper bound — should hoist
export function sumArray(arr: number[]): number {
    let total = 0;
    for (let i = 0; i < arr.size(); i++) {
        total += arr[i];
    }
    return total;
}

// Nested: both loops should have their bounds hoisted
export function matMul(a: number[], b: number[], n: number): number {
    let result = 0;
    for (let i = 0; i < a.size(); i++) {
        for (let j = 0; j < b.size(); j++) {
            result += a[i] * b[j];
        }
    }
    return result;
}

// Constant upper bound — no hoisting needed (literal, not a call)
export function fixedBound(): number {
    let sum = 0;
    for (let i = 0; i < 100; i++) {
        sum += i;
    }
    return sum;
}

// for-of loop — not a numeric for, no hoisting applies
export function forOf(arr: number[]): number {
    let sum = 0;
    for (const v of arr) {
        sum += v;
    }
    return sum;
}
