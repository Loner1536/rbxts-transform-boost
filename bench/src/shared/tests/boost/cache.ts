// Tests: repeated property chain hoisting
// Expected: chains accessed 2+ times in the same function are hoisted to locals

// v.X accessed 2x — hoisted; v.Y and v.Z accessed once each — not hoisted
export function partialHoist(v: Vector3): number {
    return v.X * v.X + v.Y + v.Z;
}

// All components accessed 2x — all hoisted
export function fullHoist(v: Vector3): number {
    return v.X * v.X + v.Y * v.Y + v.Z * v.Z;
}

// Deep chain: cam.CFrame accessed 2x — hoisted; then .Position and .LookVector accessed once each
export function chainDepth(cam: Camera): number {
    const pos = cam.CFrame.Position;
    const look = cam.CFrame.LookVector;
    return pos.Magnitude + look.X;
}

// No repeated access — nothing hoisted
export function noCache(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(a.X + b.X, a.Y + b.Y, a.Z + b.Z);
}

// Cross product: each component accessed twice
export function cross(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
        a.Y * b.Z - a.Z * b.Y,
        a.Z * b.X - a.X * b.Z,
        a.X * b.Y - a.Y * b.X,
    );
}

// Method call result used once — not cached (only property reads are cached)
export function methodNoCache(): number {
    return game.GetService("Players").GetPlayers().size();
}
