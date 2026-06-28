// No //!native at the top — only @native functions get annotated

/**
 * @native
 * Fast dot product — annotated because of @native.
 */
export function fastDot(a: Vector3, b: Vector3): number {
    return a.X * b.X + a.Y * b.Y + a.Z * b.Z;
}

/**
 * @native
 * Fast lerp — also annotated.
 */
export function fastLerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

// No @native — should NOT be annotated
export function slowAdd(a: number, b: number): number {
    return a + b;
}
