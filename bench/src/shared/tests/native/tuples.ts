//!native
// Tests: LuaTuple<[T, U]> → Luau multi-return annotation
// Expected: return type annotated as (T, U) not {T, U}

export function splitVec(v: Vector3): LuaTuple<[Vector3, number]> {
    return $tuple(v.Unit, v.Magnitude);
}

export function minmax(values: number[]): LuaTuple<[number, number]> {
    let mn = values[0];
    let mx = values[0];
    for (const v of values) {
        if (v < mn) mn = v;
        if (v > mx) mx = v;
    }
    return $tuple(mn, mx);
}

export function vecComponents(v: Vector3): LuaTuple<[number, number, number]> {
    return $tuple(v.X, v.Y, v.Z);
}

export function parseResult(ok: boolean, value: number): LuaTuple<[boolean, number]> {
    return $tuple(ok, value);
}

// Mixed types
export function partInfo(part: BasePart): LuaTuple<[Vector3, CFrame, boolean]> {
    return $tuple(part.Size, part.CFrame, part.Anchored);
}

// Single return — NOT a tuple, just a normal return type
export function single(v: Vector3): number {
    return v.Magnitude;
}
