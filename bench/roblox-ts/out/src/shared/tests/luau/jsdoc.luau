--!optimize 2
--!strict
--!native

-- Compiled with roblox-ts v3.0.0

--- Adds two numbers together.
--- @param a number The first number.
--- @param b number The second number.
--- @return number The sum of a and b.
local function add(a: number, b: number): number
	return a + b
end

--- Computes the dot product of two 3D vectors.
--- @param a Vector3 The first vector.
--- @param b Vector3 The second vector.
--- @return number The scalar dot product.
local function dot(a: Vector3, b: Vector3): number
	return a.X * b.X + a.Y * b.Y + a.Z * b.Z
end

--- Clamps a value between a minimum and maximum.
--- @param value number The value to clamp.
--- @param min number The lower bound.
--- @param max number The upper bound.
--- @return number The clamped value.
local function clamp(value: number, min: number, max: number): number
	return math.clamp(value, min, max)
end

--- Checks whether a part is anchored.
--- @param part BasePart The part to inspect.
--- @return boolean True if the part is anchored.
local function isAnchored(part: BasePart): boolean
	return part.Anchored
end

--- @deprecated Use clamp() instead.
--- @param x number The value.
--- @return number The squared value.
local function legacySquare(x: number): number
	return x * x
end

-- No JSDoc — should pass through unchanged

local function noDoc(x: number): number
	return x * 2
end

return {
	add = add,
	dot = dot,
	clamp = clamp,
	isAnchored = isAnchored,
	legacySquare = legacySquare,
	noDoc = noDoc,
}
