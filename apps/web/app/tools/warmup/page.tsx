'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  calculateWarmupSets,
  calculatePlates,
  type WarmupSet,
  type WeightUnit,
} from '@myworkouts/shared';

export default function WarmupCalculatorPage() {
  const searchParams = useSearchParams();
  const initialWeight = Number(searchParams.get('weight')) || 225;
  const initialBar = Number(searchParams.get('bar')) || 45;

  const [workingWeight, setWorkingWeight] = useState<number>(initialWeight);
  const [barWeight, setBarWeight] = useState<number>(initialBar);
  const [unit, setUnit] = useState<WeightUnit>('lbs');

  const warmupSets = useMemo(() => {
    if (workingWeight <= 0) return [];
    return calculateWarmupSets(workingWeight, barWeight);
  }, [workingWeight, barWeight]);

  // Include the working weight as the final "set"
  const allSets = useMemo(() => {
    const sets = [...warmupSets];
    if (workingWeight > 0) {
      sets.push({ weight: workingWeight, reps: 0, percentage: 100 });
    }
    return sets;
  }, [warmupSets, workingWeight]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Warm-up Calculator</h1>
      <p className="text-sm text-gray-500 mb-6">
        Progressive warm-up sets leading to your working weight
      </p>

      {/* Inputs */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Working Weight
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={5}
                value={workingWeight}
                onChange={(e) => setWorkingWeight(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-400">{unit}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Bar Weight
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={barWeight}
                onChange={(e) => setBarWeight(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-400">{unit}</span>
            </div>
          </div>
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

      {/* Warm-up Sets */}
      {allSets.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Warm-up Progression</h2>
          <div className="space-y-3">
            {allSets.map((set, i) => {
              const isWorking = set.percentage === 100;
              const plates = calculatePlates(set.weight, barWeight, unit);

              return (
                <div
                  key={i}
                  className={`rounded-lg p-3 ${
                    isWorking
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isWorking
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isWorking ? 'W' : i + 1}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          isWorking ? 'text-indigo-700' : 'text-gray-900'
                        }`}
                      >
                        {set.weight} {unit}
                      </span>
                      {set.percentage > 0 && (
                        <span className="text-xs text-gray-400">
                          ({set.percentage}%)
                        </span>
                      )}
                    </div>
                    <span className={`text-sm ${isWorking ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>
                      {isWorking
                        ? 'Working Set'
                        : set.percentage === 0
                          ? `${set.reps} reps (bar only)`
                          : `${set.reps} reps`}
                    </span>
                  </div>

                  {/* Plate breakdown for each set */}
                  {plates.perSide.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1 pl-8">
                      Each side:{' '}
                      {plates.perSide
                        .map((p) => `${p.count}x ${p.weight} ${unit}`)
                        .join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Link to plate calculator */}
      <div className="text-center">
        <Link
          href={`/tools/plate-calculator`}
          className="text-sm text-indigo-500 hover:underline"
        >
          Open full Plate Calculator
        </Link>
      </div>
    </div>
  );
}
