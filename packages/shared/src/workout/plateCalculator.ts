/**
 * Plate calculator for barbell loading.
 * Greedy algorithm: subtract bar weight, divide by 2, fit largest plates first.
 */

import type { WeightUnit } from '../types/index';

export const STANDARD_PLATES_LBS = [45, 35, 25, 10, 5, 2.5];
export const STANDARD_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

export interface PlateResult {
  perSide: { weight: number; count: number }[];
  totalWeight: number;
  remainder: number;
}

/**
 * Calculate plates needed per side to reach the target weight.
 * Returns the plate breakdown, actual total weight achieved, and any remainder
 * that cannot be loaded with available plates.
 */
export function calculatePlates(
  targetWeight: number,
  barWeight: number,
  unit: WeightUnit,
): PlateResult {
  const plates = unit === 'lbs' ? STANDARD_PLATES_LBS : STANDARD_PLATES_KG;

  if (targetWeight <= barWeight) {
    return { perSide: [], totalWeight: barWeight, remainder: 0 };
  }

  let remaining = (targetWeight - barWeight) / 2;
  const perSide: { weight: number; count: number }[] = [];

  for (const plate of plates) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      perSide.push({ weight: plate, count });
      remaining -= count * plate;
    }
  }

  // Round remainder to avoid floating point issues
  const remainder = Math.round(remaining * 100) / 100;
  const loadedPerSide = perSide.reduce((sum, p) => sum + p.weight * p.count, 0);
  const totalWeight = barWeight + loadedPerSide * 2;

  return { perSide, totalWeight, remainder };
}
