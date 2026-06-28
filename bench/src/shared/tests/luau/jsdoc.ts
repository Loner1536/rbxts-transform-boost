//!native

import { useImperativeHandle } from "@rbxts/react";

/**
 * Adds two numbers together.
 * @param a The first number.
 * @param b The second number.
 * @returns The sum of a and b.
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * Computes the dot product of two 3D vectors.
 * @param a The first vector.
 * @param b The second vector.
 * @returns The scalar dot product.
 */
export function dot(a: Vector3, b: Vector3): number {
  return a.X * b.X + a.Y * b.Y + a.Z * b.Z;
}

/**
 * Clamps a value between a minimum and maximum.
 * @param value The value to clamp.
 * @param min The lower bound.
 * @param max The upper bound.
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
  return math.clamp(value, min, max);
}

/**
 * Checks whether a part is anchored.
 * @param part The part to inspect.
 * @returns True if the part is anchored.
 */
export function isAnchored(part: BasePart): boolean {
  return part.Anchored;
}

/**
 * @deprecated Use clamp() instead.
 * @param x The value.
 * @returns The squared value.
 */
export function legacySquare(x: number): number {
  return x * x;
}

// No JSDoc — should pass through unchanged
export function noDoc(x: number): number {
  return x * 2;
}
