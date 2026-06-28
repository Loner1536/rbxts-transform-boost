--!optimize 2
--!strict
--!native

-- Compiled with roblox-ts v3.0.0

-- Services
const _RunService = game:GetService("RunService")
const _Workspace = game:GetService("Workspace")
const _Players = game:GetService("Players")

local function svc1(): boolean
	return _RunService:IsRunning()
end

local function svc2(): boolean
	return _RunService:IsRunning() and _RunService:IsServer()
end

local function svc3(): boolean
	return _RunService:IsRunning() and _Players.MaxPlayers > 0 and _Workspace.Gravity > 0
end

-- Property chains ─────────────────────────────────────────────────────────────

local function camChain(camera: Camera): number
	return camera.CFrame.Position.X + camera.CFrame.LookVector.X + camera.CFrame.UpVector.X
end

local function camDeep(camera: Camera): number
	const _cache0 = camera.CFrame.Position.X
	const _cache1 = camera.CFrame.Position.Y
	const _cache2 = camera.CFrame.Position.Z

	return _cache0 * _cache0 + _cache1 * _cache1 + _cache2 * _cache2
end

-- Vector3 field access ────────────────────────────────────────────────────────

local function dot(a: Vector3, b: Vector3): number
	return a.X * b.X + a.Y * b.Y + a.Z * b.Z
end

local function cross(a: Vector3, b: Vector3): Vector3
	return Vector3.new(a.Y * b.Z - a.Z * b.Y, a.Z * b.X - a.X * b.Z, a.X * b.Y - a.Y * b.X)
end

local function lerpVec3(a: Vector3, b: Vector3, t: number): Vector3
	return Vector3.new(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t, a.Z + (b.Z - a.Z) * t)
end

local function integrate(pos: Vector3, vel: Vector3, acc: Vector3, dt: number): (Vector3, Vector3)
	const _vel = vel
	const _acc = acc
	const _dt = dt
	const newVel = _vel + (_acc * _dt)
	const _pos = pos
	const _dt_1 = dt
	const _arg0 = newVel * _dt_1
	const newPos = _pos + _arg0

	return newPos, newVel
end

-- Loop bounds ─────────────────────────────────────────────────────────────────

local function sumArray(values: {number}): number
	local total = 0

	do
		const _len_values = #values

		do
			local i = 0
			local _shouldIncrement = false

			while true do
				if _shouldIncrement then
					i += 1
				else
					_shouldIncrement = true
				end

				if not (i < _len_values) then
					break
				end

				total += values[i + 1]
			end
		end
	end

	return total
end

local function weightedSum(values: {number}, weights: {number}): number
	local total = 0

	do
		const _len_values = #values

		do
			local i = 0
			local _shouldIncrement = false

			while true do
				if _shouldIncrement then
					i += 1
				else
					_shouldIncrement = true
				end

				if not (i < _len_values) then
					break
				end

				total += values[i + 1] * weights[i + 1]
			end
		end
	end

	return total
end

-- CFrame ──────────────────────────────────────────────────────────────────────

local function cfLookAt(eye: Vector3, target: Vector3): CFrame
	return CFrame.lookAt(eye, target)
end

local function cfChain(cf: CFrame, dt: number): CFrame
	const _cf = cf
	const _arg0 = CFrame.Angles(0, dt, 0)

	return _cf * _arg0
end

return {
	svc1 = svc1,
	svc2 = svc2,
	svc3 = svc3,
	camChain = camChain,
	camDeep = camDeep,
	dot = dot,
	cross = cross,
	lerpVec3 = lerpVec3,
	integrate = integrate,
	sumArray = sumArray,
	weightedSum = weightedSum,
	cfLookAt = cfLookAt,
	cfChain = cfChain,
}
