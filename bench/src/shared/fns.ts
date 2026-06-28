//!native

// GetService ──────────────────────────────────────────────────────────────────
// Transformer hoists repeated GetService calls to module-level consts.

// 1× call — baseline, no hoisting benefit
export function svc1(): boolean {
    return game.GetService("RunService").IsRunning();
}

// 2× same service — hoisted from 2 lookups to 1
export function svc2(): boolean {
    return (
        game.GetService("RunService").IsRunning() &&
        game.GetService("RunService").IsServer()
    );
}

// 3× different services — all three hoisted
export function svc3(): boolean {
    return (
        game.GetService("RunService").IsRunning() &&
        game.GetService("Players").MaxPlayers > 0 &&
        game.GetService("Workspace").Gravity > 0
    );
}

// Property chains ─────────────────────────────────────────────────────────────
// Transformer caches repeated intermediate property reads.

// camera.CFrame accessed 3× → _CFrame cached once
export function camChain(camera: Camera): number {
    return (
        camera.CFrame.Position.X +
        camera.CFrame.LookVector.X +
        camera.CFrame.UpVector.X
    );
}

// camera.CFrame.Position accessed 3× → _CFrame then _Position both cached
export function camDeep(camera: Camera): number {
    return (
        camera.CFrame.Position.X * camera.CFrame.Position.X +
        camera.CFrame.Position.Y * camera.CFrame.Position.Y +
        camera.CFrame.Position.Z * camera.CFrame.Position.Z
    );
}

// Vector3 field access ────────────────────────────────────────────────────────
// Transformer hoists fields accessed more than once per function.

// dot: each field accessed once — control, minimal benefit
export function dot(a: Vector3, b: Vector3): number {
    return a.X * b.X + a.Y * b.Y + a.Z * b.Z;
}

// cross: each of a.X/Y/Z and b.X/Y/Z accessed twice — all 6 fields hoisted
export function cross(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
        a.Y * b.Z - a.Z * b.Y,
        a.Z * b.X - a.X * b.Z,
        a.X * b.Y - a.Y * b.X,
    );
}

// lerp: a.X + b.X each accessed twice — all 6 fields hoisted
export function lerpVec3(a: Vector3, b: Vector3, t: number): Vector3 {
    return new Vector3(
        a.X + (b.X - a.X) * t,
        a.Y + (b.Y - a.Y) * t,
        a.Z + (b.Z - a.Z) * t,
    );
}

// Verlet integration using method calls — less field hoisting, more CFrame-style
export function integrate(
    pos: Vector3,
    vel: Vector3,
    acc: Vector3,
    dt: number,
): LuaTuple<[Vector3, Vector3]> {
    const newVel = vel.add(acc.mul(dt));
    const newPos = pos.add(newVel.mul(dt));
    return $tuple(newPos, newVel);
}

// Loop bounds ─────────────────────────────────────────────────────────────────
// Transformer hoists values.size() out of the loop condition.

export function sumArray(values: Array<number>): number {
    let total = 0;
    for (let i = 0; i < values.size(); i++) {
        total += values[i];
    }
    return total;
}

export function weightedSum(values: Array<number>, weights: Array<number>): number {
    let total = 0;
    for (let i = 0; i < values.size(); i++) {
        total += values[i] * weights[i];
    }
    return total;
}

// CFrame ──────────────────────────────────────────────────────────────────────

export function cfLookAt(eye: Vector3, target: Vector3): CFrame {
    return CFrame.lookAt(eye, target);
}

export function cfChain(cf: CFrame, dt: number): CFrame {
    return cf.mul(CFrame.Angles(0, dt, 0));
}
