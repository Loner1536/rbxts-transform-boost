--!optimize 2
--!strict

-- Compiled with rotor v2.2.0

-- Services
const _RunService = game:GetService("RunService")
const _Workspace = game:GetService("Workspace")
const _Players = game:GetService("Players")

local function multiHoist(): string
	const count = #_Players:GetPlayers()
	const max = _Players.MaxPlayers
	const name = _Players.Name
	const running = _RunService:IsRunning()
	const server = _RunService:IsServer()

	return `{count}/{max}/{name}/{running}/{server}`
end

-- Workspace used only once — should NOT be hoisted

local function noHoist(): number
	return _Workspace.Gravity
end

-- Players used 2x in one function, Workspace once in another — Players hoisted, Workspace not

local function mixed()
	const a = #_Players:GetPlayers()
	const b = _Players.MaxPlayers

	return { a, b }
end

local function mixedNoHoist(): Vector3
	return _Workspace.CurrentCamera.CFrame.Position
end

-- All three services used 2+ times — all three should be hoisted

local function tripleHoist(): boolean
	const r1 = _RunService:IsRunning()
	const r2 = _RunService:IsServer()
	const w1 = _Workspace.Gravity > 0
	const w2 = _Workspace.StreamingEnabled
	const p1 = #_Players:GetPlayers() > 0
	const p2 = _Players.MaxPlayers > 0

	return r1 and r2 and w1 and w2 and p1 and p2
end

return {
	multiHoist = multiHoist,
	noHoist = noHoist,
	mixed = mixed,
	mixedNoHoist = mixedNoHoist,
	tripleHoist = tripleHoist,
}
