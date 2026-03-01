'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  calculatePlates,
  type PlateResult,
  type WeightUnit,
  STANDARD_PLATES_LBS,
  STANDARD_PLATES_KG,
} from '@myworkouts/shared';

const BAR_OPTIONS = [
  { label: '45 lbs (Standard)', weight: 45, unit: 'lbs' as WeightUnit },
  { label: '35 lbs (Women\'s)', weight: 35, unit: 'lbs' as WeightUnit },
  { label: '20 kg (Olympic)', weight: 20, unit: 'kg' as WeightUnit },
  { label: '15 kg (Women\'s)', weight: 15, unit: 'kg' as WeightUnit },
];

// Colors for plate visualization
const PLATE_COLORS_LBS: Record<number, string> = {
  45: '#EF4444',   // red
  35: '#F59E0B',   // amber
  25: '#22C55E',   // green
  10: '#3B82F6',   // blue
  5: '#8B5CF6',    // violet
  2.5: '#EC4899',  // pink
};

const PLATE_COLORS_KG: Record<number, string> = {
  25: '#EF4444',
  20: '#3B82F6',
  15: '#F59E0B',
  10: '#22C55E',
  5: '#8B5CF6',
  2.5: '#EC4899',
  1.25: '#6B7280',
};

export default function PlateCalculatorPage() {
  const [targetWeight, setTargetWeight] = useState<number>(225);
  const [barIndex, setBarIndex] = useState(0);
  const [customBar, setCustomBar] = useState<number | null>(null);
  const [unit, setUnit] = useState<WeightUnit>('lbs');

  const barWeight = customBar ?? BAR_OPTIONS[barIndex].weight;

  const result = useMemo(() => {
    if (targetWeight <= 0) return null;
    return calculatePlates(targetWeight, barWeight, unit);
  }, [targetWeight, barWeight, unit]);

  const plateColors = unit === 'lbs' ? PLATE_COLORS_LBS : PLATE_COLORS_KG;

  // Generate flat list of plates for visual
  const plateList = useMemo(() => {
    if (!result) return [];
    const plates: { weight: number; color: string }[] = [];
    for (const p of result.perSide) {
      for (let i = 0; i < p.count; i++) {
        plates.push({ weight: p.weight, color: plateColors[p.weight] ?? '#6B7280' });
      }
    }
    return plates;
  }, [result, plateColors]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Plate Calculator</h1>
      <p className="text-sm text-gray-500 mb-6">
        Figure out which plates to load on each side of the bar
      </p>

      {/* Inputs */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Target Weight */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Target Weight
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={unit === 'lbs' ? 5 : 2.5}
                value={targetWeight}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-400">{unit}</span>
            </div>
          </div>

          {/* Bar Weight */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Bar Weight
            </label>
            <select
              value={customBar !== null ? 'custom' : barIndex}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setCustomBar(45);
                } else {
                  setCustomBar(null);
                  const idx = Number(e.target.value);
                  setBarIndex(idx);
                  setUnit(BAR_OPTIONS[idx].unit);
                }
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {BAR_OPTIONS.map((opt, i) => (
                <option key={i} value={i}>
                  {opt.label}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {customBar !== null && (
              <input
                type="number"
                min={0}
                value={customBar}
                onChange={(e) => setCustomBar(Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Custom bar weight"
              />
            )}
          </div>

          {/* Unit Toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Unit
            </label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setUnit('lbs')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  unit === 'lbs'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                lbs
              </button>
              <button
                type="button"
                onClick={() => setUnit('kg')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  unit === 'kg'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                kg
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Barbell Visual */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Barbell Loading</h2>
            <div className="flex items-center justify-center gap-0 h-20 overflow-x-auto">
              {/* Left collar */}
              <div className="w-2 h-3 bg-gray-400 rounded-l" />
              {/* Left plates (reversed for visual) */}
              {plateList
                .slice()
                .reverse()
                .map((plate, i) => (
                  <div
                    key={`l-${i}`}
                    className="flex items-center justify-center rounded-sm text-white text-[9px] font-bold"
                    style={{
                      backgroundColor: plate.color,
                      width: Math.max(16, plate.weight / 2.5 + 12),
                      height: Math.min(72, 28 + plate.weight * 0.8),
                    }}
                  >
                    {plate.weight}
                  </div>
                ))}
              {/* Bar */}
              <div className="h-3 bg-gray-400 flex-shrink-0" style={{ width: 80 }}>
                <div className="text-[9px] text-center text-white leading-3">
                  {barWeight} {unit}
                </div>
              </div>
              {/* Right plates */}
              {plateList.map((plate, i) => (
                <div
                  key={`r-${i}`}
                  className="flex items-center justify-center rounded-sm text-white text-[9px] font-bold"
                  style={{
                    backgroundColor: plate.color,
                    width: Math.max(16, plate.weight / 2.5 + 12),
                    height: Math.min(72, 28 + plate.weight * 0.8),
                  }}
                >
                  {plate.weight}
                </div>
              ))}
              {/* Right collar */}
              <div className="w-2 h-3 bg-gray-400 rounded-r" />
            </div>
          </div>

          {/* Text Breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Per Side</h2>
            {result.perSide.length === 0 ? (
              <p className="text-sm text-gray-400">Bar only, no plates needed.</p>
            ) : (
              <div className="space-y-2">
                {result.perSide.map((p) => (
                  <div key={p.weight} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-sm"
                        style={{ backgroundColor: plateColors[p.weight] ?? '#6B7280' }}
                      />
                      <span className="text-sm text-gray-700">
                        {p.weight} {unit}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      x {p.count}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total achievable weight</span>
                <span className="font-semibold text-gray-900">
                  {result.totalWeight} {unit}
                </span>
              </div>
              {result.remainder > 0 && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-amber-600">Remainder (not loadable)</span>
                  <span className="font-medium text-amber-600">
                    {result.remainder} {unit} per side
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h2>
            <div className="flex flex-wrap gap-2">
              {(unit === 'lbs'
                ? [95, 135, 185, 225, 275, 315, 365, 405]
                : [40, 60, 80, 100, 120, 140, 160, 180]
              ).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setTargetWeight(w)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    targetWeight === w
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {w} {unit}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Link to warmup calculator */}
      <div className="mt-6 text-center">
        <Link
          href={`/tools/warmup${targetWeight > 0 ? `?weight=${targetWeight}&bar=${barWeight}` : ''}`}
          className="text-sm text-indigo-500 hover:underline"
        >
          Calculate warm-up sets for this weight
        </Link>
      </div>
    </div>
  );
}
