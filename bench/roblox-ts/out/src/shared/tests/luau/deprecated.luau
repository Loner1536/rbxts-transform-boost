--!optimize 2
--!strict

-- Compiled with roblox-ts v3.0.0

--- @deprecated Use add() instead.
--- @param a number First number.
--- @param b number Second number.
--- @return number The sum.
local function oldAdd(a: number, b: number): number
	return a + b
end

--- @deprecated Use Vector3.new() directly.
--- @param x number X component.
--- @param y number Y component.
--- @param z number Z component.
--- @return Vector3 A new Vector3.
local function makeVec(x: number, y: number, z: number): Vector3
	return Vector3.new(x, y, z)
end

--- @deprecated No replacement available.
local function noReplacement(): ()
	-- nothing
end

--- @deprecated
--- No deprecation message — tag alone should still emit ---@deprecated.
local function silentDeprecated(x: number): number
	return x
end

-- Not deprecated — should pass through without ---@deprecated

local function current(x: number): number
	return x * 2
end

--- Has JSDoc but no deprecated tag — should pass through cleanly.
--- @param x number The value.
--- @return number Doubled.
local function currentWithDoc(x: number): number
	return x * 2
end

return {
	oldAdd = oldAdd,
	makeVec = makeVec,
	noReplacement = noReplacement,
	silentDeprecated = silentDeprecated,
	current = current,
	currentWithDoc = currentWithDoc,
}
