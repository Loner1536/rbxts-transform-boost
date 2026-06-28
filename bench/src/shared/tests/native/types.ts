//!native
// Tests: Luau type annotation injection
// Expected: function parameters and return types annotated where TypeScript types map to known Luau types

// Primitives
export function primitives(n: number, s: string, b: boolean): number {
    return n;
}

// Roblox value types
export function vecMath(pos: Vector3, vel: Vector3, dt: number): Vector3 {
    return pos.add(vel.mul(dt));
}

export function cfTransform(cf: CFrame, offset: Vector3): CFrame {
    return cf.mul(new CFrame(offset));
}

export function colorBlend(a: Color3, b: Color3, t: number): Color3 {
    return a.Lerp(b, t);
}

export function udimScale(u: UDim2, scale: number): UDim2 {
    return new UDim2(u.X.Scale * scale, u.X.Offset, u.Y.Scale * scale, u.Y.Offset);
}

// Buffer
export function bufferWrite(buf: buffer, offset: number, value: number): number {
    buffer.writef32(buf, offset, value);
    return offset + 4;
}

// Arrays
export function sumVecs(vecs: Vector3[]): Vector3 {
    let result = new Vector3(0, 0, 0);
    for (const v of vecs) result = result.add(v);
    return result;
}

export function sumNumbers(nums: number[]): number {
    let total = 0;
    for (const n of nums) total += n;
    return total;
}

// Instance types
export function partSize(part: BasePart): Vector3 {
    return part.Size;
}

export function playerName(player: Player): string {
    return player.Name;
}

// Types that have no Luau mapping — should NOT be annotated
export function noAnnotation(a: unknown, b: object, c: Map<string, number>): void {
    // unknown, object, Map have no Luau equivalent — params left untyped
}

// void return
export function voidReturn(x: number): void {
    math.abs(x);
}
