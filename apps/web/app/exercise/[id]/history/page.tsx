'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Exercise1RMHistory } from '@myworkouts/shared';
import { findFallbackExercise, loadExercisesWithFallback } from '../../../../lib/exercises';

interface HistoryRow {
  id: string;
  user_id: string;
  exercise_id: string;
  estimated_1rm: number;
  weight: number;
  reps: number;
  recorded_at: string;
}

type TimeRange = '1m' | '3m' | '6m' | '1y' | 'all';
type ChartMode = '1rm' | 'max_weight';

function getDateThreshold(range: TimeRange): Date | null {
  if (range === 'all') return null;
  const now = new Date();
  switch (range) {
    case '1m':
      now.setMonth(now.getMonth() - 1);
      return now;
    case '3m':
      now.setMonth(now.getMonth() - 3);
      return now;
    case '6m':
      now.setMonth(now.getMonth() - 6);
      return now;
    case '1y':
      now.setFullYear(now.getFullYear() - 1);
      return now;
  }
}

export default function ExerciseHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exerciseName, setExerciseName] = useState<string>('');
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>('3m');
  const [mode, setMode] = useState<ChartMode>('1rm');

  useEffect(() => {
    // Resolve exercise name
    const found = findFallbackExercise(id);
    if (found) {
      setExerciseName(found.name);
    } else {
      void loadExercisesWithFallback().then((exercises) => {
        const match = exercises.find((e) => e.id === id);
        if (match) setExerciseName(match.name);
      });
    }

    // Fetch 1RM history from local DB
    void (async () => {
      try {
        const response = await fetch(`/api/exercise-history?exerciseId=${encodeURIComponent(id)}`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch {
        // Silently fail for local mode
      }
      setLoading(false);
    })();
  }, [id]);

  const filteredHistory = useMemo(() => {
    const threshold = getDateThreshold(range);
    if (!threshold) return history;
    const thresholdStr = threshold.toISOString();
    return history.filter((h) => h.recorded_at >= thresholdStr);
  }, [history, range]);

  const chartData = useMemo(() => {
    return filteredHistory
      .map((h) => ({
        date: h.recorded_at,
        value: mode === '1rm' ? h.estimated_1rm : h.weight,
        label: new Date(h.recorded_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredHistory, mode]);

  const allTimeMax = useMemo(() => {
    if (history.length === 0) return null;
    return history.reduce((max, h) => {
      const val = mode === '1rm' ? h.estimated_1rm : h.weight;
      return val > max.value ? { value: val, date: h.recorded_at } : max;
    }, { value: 0, date: '' });
  }, [history, mode]);

  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const isNewPR = allTimeMax && latestValue >= allTimeMax.value && chartData.length > 1;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Exercise
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        {exerciseName || 'Exercise'} History
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Track your strength progression over time
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Time range */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['1m', '3m', '6m', '1y', 'all'] as TimeRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r === 'all' ? 'All' : r.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Chart mode */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setMode('1rm')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === '1rm'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Est. 1RM
          </button>
          <button
            type="button"
            onClick={() => setMode('max_weight')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'max_weight'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Max Weight
          </button>
        </div>
      </div>

      {/* PR Badge */}
      {isNewPR && (
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2l2.5 5.5L18 8.5l-4 4 1 5.5L10 15.5 4.5 18l1-5.5-4-4 5.5-1z" />
          </svg>
          New PR!
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500 mb-2">No history data yet.</p>
          <p className="text-sm text-gray-400">
            Complete workouts with this exercise to start tracking progression.
          </p>
        </div>
      ) : (
        <>
          {/* SVG Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
            <ProgressionChart data={chartData} allTimeMax={allTimeMax} mode={mode} />
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500 mb-1">Current</div>
              <div className="text-2xl font-bold text-gray-900">
                {latestValue}
                <span className="text-sm font-normal text-gray-400 ml-1">lbs</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500 mb-1">All-Time Best</div>
              <div className="text-2xl font-bold text-indigo-600">
                {allTimeMax?.value ?? 0}
                <span className="text-sm font-normal text-gray-400 ml-1">lbs</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500 mb-1">Data Points</div>
              <div className="text-2xl font-bold text-gray-900">{chartData.length}</div>
            </div>
          </div>

          {/* History Table */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Session Log</h2>
            <div className="divide-y divide-gray-100">
              {chartData
                .slice()
                .reverse()
                .map((point, i) => {
                  const row = filteredHistory.find((h) => h.recorded_at === point.date);
                  return (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="text-sm text-gray-700">{point.label}</div>
                      <div className="flex gap-4 text-xs">
                        {row && (
                          <>
                            <span className="text-gray-500">
                              <span className="font-medium text-gray-900">{row.weight}</span> lbs
                            </span>
                            <span className="text-gray-500">
                              <span className="font-medium text-gray-900">{row.reps}</span> reps
                            </span>
                          </>
                        )}
                        <span className="text-gray-500">
                          {mode === '1rm' ? 'Est. 1RM: ' : 'Max: '}
                          <span className="font-medium text-indigo-600">{point.value}</span> lbs
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// SVG-based line chart component
function ProgressionChart({
  data,
  allTimeMax,
  mode,
}: {
  data: { date: string; value: number; label: string }[];
  allTimeMax: { value: number; date: string } | null;
  mode: ChartMode;
}) {
  if (data.length === 0) return null;

  const chartW = 600;
  const chartH = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.1;
  const valRange = maxVal - minVal || 1;

  const xScale = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const yScale = (v: number) => padding.top + innerH - ((v - minVal) / valRange) * innerH;

  // Line path
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.value).toFixed(1)}`)
    .join(' ');

  // Simple linear trend line
  const n = data.length;
  const sumX = data.reduce((s, _, i) => s + i, 0);
  const sumY = data.reduce((s, d) => s + d.value, 0);
  const sumXY = data.reduce((s, d, i) => s + i * d.value, 0);
  const sumX2 = data.reduce((s, _, i) => s + i * i, 0);
  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
  const intercept = (sumY - slope * sumX) / n;
  const trendStart = intercept;
  const trendEnd = intercept + slope * (n - 1);

  // Y-axis ticks
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round(minVal + (valRange * i) / tickCount),
  );

  // PR point index
  const prIndex = allTimeMax
    ? data.findIndex((d) => d.date === allTimeMax.date)
    : -1;

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Y-axis labels and grid lines */}
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={padding.left}
            y1={yScale(tick)}
            x2={chartW - padding.right}
            y2={yScale(tick)}
            stroke="#E5E7EB"
            strokeDasharray="4 4"
          />
          <text
            x={padding.left - 8}
            y={yScale(tick) + 4}
            textAnchor="end"
            className="fill-gray-400"
            fontSize={10}
          >
            {tick}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        // Show at most 8 labels
        const skip = Math.ceil(data.length / 8);
        if (i % skip !== 0 && i !== data.length - 1) return null;
        return (
          <text
            key={i}
            x={xScale(i)}
            y={chartH - 5}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize={10}
          >
            {d.label}
          </text>
        );
      })}

      {/* Trend line */}
      {n > 1 && (
        <line
          x1={xScale(0)}
          y1={yScale(trendStart)}
          x2={xScale(n - 1)}
          y2={yScale(trendEnd)}
          stroke="#A5B4FC"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          opacity={0.7}
        />
      )}

      {/* Data line */}
      <path d={linePath} fill="none" stroke="#6366F1" strokeWidth={2} />

      {/* Data points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(d.value)}
          r={i === prIndex ? 5 : 3}
          fill={i === prIndex ? '#F59E0B' : '#6366F1'}
          stroke={i === prIndex ? '#D97706' : '#fff'}
          strokeWidth={i === prIndex ? 2 : 1.5}
        />
      ))}

      {/* PR label */}
      {prIndex >= 0 && (
        <text
          x={xScale(prIndex)}
          y={yScale(data[prIndex].value) - 10}
          textAnchor="middle"
          className="fill-amber-600"
          fontSize={10}
          fontWeight="bold"
        >
          PR
        </text>
      )}
    </svg>
  );
}
