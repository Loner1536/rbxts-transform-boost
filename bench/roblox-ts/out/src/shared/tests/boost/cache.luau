--!optimize 2
--!strict

-- Compiled with roblox-ts v3.0.0

-- Services
const _Players = game:GetService("Players")

local function partialHoist(v: Vector3): number
	return v.X * v.X + v.Y + v.Z
end

-- All components accessed 2x — all hoisted

local function fullHoist(v: Vector3): number
	return v.X * v.X + v.Y * v.Y + v.Z * v.Z
end

-- Deep chain: cam.CFrame accessed 2x — hoisted; then .Position and .LookVector accessed once each

local function chainDepth(cam: Camera): number
	const pos = cam.CFrame.Position
	const look = cam.CFrame.LookVector

	return pos.Magnitude + look.X
end

-- No repeated access — nothing hoisted

local function noCache(a: Vector3, b: Vector3): Vector3
	return Vector3.new(a.X + b.X, a.Y + b.Y, a.Z + b.Z)
end

-- Cross product: each component accessed twice

local function cross(a: Vector3, b: Vector3): Vector3
	return Vector3.new(a.Y * b.Z - a.Z * b.Y, a.Z * b.X - a.X * b.Z, a.X * b.Y - a.Y * b.X)
end

-- Method call result used once — not cached (only property reads are cached)

local function methodNoCache(): number
	return #_Players:GetPlayers()
end

return {
	partialHoist = partialHoist,
	fullHoist = fullHoist,
	chainDepth = chainDepth,
	noCache = noCache,
	cross = cross,
	methodNoCache = methodNoCache,
}
