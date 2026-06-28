--!optimize 2
--!strict

-- Compiled with rotor v2.2.0

-- Services
const _ReplicatedStorage = game:GetService("ReplicatedStorage")
const _Workspace = game:GetService("Workspace")

-- Runtime
const TS = require(_ReplicatedStorage:WaitForChild("include"):WaitForChild("RuntimeLib"))

-- Imports
local base; if false then base = require(_ReplicatedStorage.shared["fns-bare"]) else base = TS.import(script, _ReplicatedStorage, "shared", "fns-bare") :: any end
local opt; if false then opt = require(_ReplicatedStorage.shared.fns) else opt = TS.import(script, _ReplicatedStorage, "shared", "fns") :: any end

local function bench(label: string, n: number, fn): ()
	-- warmup
	do
		local i = 0
		local _shouldIncrement = false

		while true do
			if _shouldIncrement then
				i += 1
			else
				_shouldIncrement = true
			end

			if not (i < math.max(100, n / 100)) then
				break
			end

			fn()
		end
	end

	task.wait(0.05)
	const t0 = os.clock()

	do
		local i = 0
		local _shouldIncrement = false

		while true do
			if _shouldIncrement then
				i += 1
			else
				_shouldIncrement = true
			end

			if not (i < n) then
				break
			end

			fn()
		end
	end

	const elapsed = os.clock() - t0
	print(`  {label}: {string.format("%.3f", (elapsed / n) * 1e6)} us/iter`)
end

const N = 100000
const NS = 10000
const pos = Vector3.new(1, 2, 3)
const vel = Vector3.new(0, 1, 0)
const acc = Vector3.new(0, -9.8, 0)
const vecA = Vector3.new(1, 0, 0)
const vecB = Vector3.new(0, 1, 0)
const eye = Vector3.new(0, 5, 10)
const tgt = Vector3.new(0, 0, 0)
const cf = CFrame.lookAt(eye, tgt)
const vals = { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 }
const wts = { 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 }
const cam = _Workspace.CurrentCamera

local function runSuite(fns): ()
	print("  -- GetService hoisting")
	bench("svc ×1 (baseline)       ", N, function()
		return fns.svc1()
	end)
	bench("svc ×2 (same service)   ", N, function()
		return fns.svc2()
	end)
	bench("svc ×3 (diff services)  ", N, function()
		return fns.svc3()
	end)
	print("  -- Property chain caching")
	bench("cam.CFrame ×3           ", N, function()
		return fns.camChain(cam)
	end)
	bench("cam.CFrame.Position ×3  ", N, function()
		return fns.camDeep(cam)
	end)
	print("  -- Vector3 field hoisting")
	bench("dot    (×1 each field)  ", N, function()
		return fns.dot(vecA, vecB)
	end)
	bench("cross  (×2 each field)  ", N, function()
		return fns.cross(vecA, vecB)
	end)
	bench("lerp   (×2 each field)  ", N, function()
		return fns.lerpVec3(pos, eye, 0.5)
	end)
	bench("integrate (method calls) ", N, function()
		return fns.integrate(pos, vel, acc, 1 / 60)
	end)
	print("  -- Loop bounds hoisting")
	bench("sumArray   (size ×1)    ", N, function()
		return fns.sumArray(vals)
	end)
	bench("weightedSum(size ×1)    ", N, function()
		return fns.weightedSum(vals, wts)
	end)
	print("  -- CFrame")
	bench("cfLookAt (ctor)         ", NS, function()
		return fns.cfLookAt(eye, tgt)
	end)
	bench("cfChain  (mul+angles)   ", N, function()
		return fns.cfChain(cf, 0.016)
	end)
end

print("\n=== WITH transformer (hoisting + const + type annotations) ===")
runSuite(opt)
print("==============================================================\n")
task.wait(1)
print("\n=== WITHOUT transformer (raw roblox-ts output) ===")
runSuite(base)
print("==================================================\n")
