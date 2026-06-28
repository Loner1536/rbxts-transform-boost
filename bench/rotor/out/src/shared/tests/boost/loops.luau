--!optimize 2
--!strict

-- Compiled with rotor v2.2.0

local function sumArray(arr: {number}): number
	local total = 0

	do
		const _len_arr = #arr

		do
			local i = 0
			local _shouldIncrement = false

			while true do
				if _shouldIncrement then
					i += 1
				else
					_shouldIncrement = true
				end

				if not (i < _len_arr) then
					break
				end

				total += arr[i + 1]
			end
		end
	end

	return total
end

-- Nested: both loops should have their bounds hoisted

local function matMul(a: {number}, b: {number}, n: number): number
	local result = 0

	do
		const _len_a = #a

		do
			local i = 0
			local _shouldIncrement = false

			while true do
				if _shouldIncrement then
					i += 1
				else
					_shouldIncrement = true
				end

				if not (i < _len_a) then
					break
				end

				for j = 0, #b - 1 do
					result += a[i + 1] * b[j + 1]
				end
			end
		end
	end

	return result
end

-- Constant upper bound — no hoisting needed (literal, not a call)

local function fixedBound(): number
	local sum = 0

	for i = 0, 99 do
		sum += i
	end

	return sum
end

-- for-of loop — not a numeric for, no hoisting applies

local function forOf(arr: {number}): number
	local sum = 0

	for _, v in arr do
		sum += v
	end

	return sum
end

return {
	sumArray = sumArray,
	matMul = matMul,
	fixedBound = fixedBound,
	forOf = forOf,
}
