// Tests: game:GetService() hoisting
// Expected: services used 2+ times are hoisted to module-level locals (_Players, etc.)
// Expected: services used only once are NOT hoisted

// Players used 3x, RunService used 2x — both should be hoisted
export function multiHoist(): string {
    const count = game.GetService("Players").GetPlayers().size();
    const max = game.GetService("Players").MaxPlayers;
    const name = game.GetService("Players").Name;
    const running = game.GetService("RunService").IsRunning();
    const server = game.GetService("RunService").IsServer();
    return `${count}/${max}/${name}/${running}/${server}`;
}

// Workspace used only once — should NOT be hoisted
export function noHoist(): number {
    return game.GetService("Workspace").Gravity;
}

// Players used 2x in one function, Workspace once in another — Players hoisted, Workspace not
export function mixed(): [number, number] {
    const a = game.GetService("Players").GetPlayers().size();
    const b = game.GetService("Players").MaxPlayers;
    return [a, b];
}

export function mixedNoHoist(): Vector3 {
    return game.GetService("Workspace").CurrentCamera!.CFrame.Position;
}

// All three services used 2+ times — all three should be hoisted
export function tripleHoist(): boolean {
    const r1 = game.GetService("RunService").IsRunning();
    const r2 = game.GetService("RunService").IsServer();
    const w1 = game.GetService("Workspace").Gravity > 0;
    const w2 = game.GetService("Workspace").StreamingEnabled;
    const p1 = game.GetService("Players").GetPlayers().size() > 0;
    const p2 = game.GetService("Players").MaxPlayers > 0;
    return r1 && r2 && w1 && w2 && p1 && p2;
}
