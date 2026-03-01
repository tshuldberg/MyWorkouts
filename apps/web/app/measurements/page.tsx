'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

interface Measurement {
  id: string;
  user_id: string;
  measurement_type: string;
  value: number;
  unit: string;
  measured_at: string;
}

const PREDEFINED_TYPES = [
  'chest',
  'waist',
  'hips',
  'biceps_left',
  'biceps_right',
  'thighs_left',
  'thighs_right',
  'calves_left',
  'calves_right',
  'neck',
  'shoulders',
  'forearms',
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedType, setSelectedType] = useState(PREDEFINED_TYPES[0]);
  const [customType, setCustomType] = useState('');
  const [useCustomType, setUseCustomType] = useState(false);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Chart state
  const [chartType, setChartType] = useState(PREDEFINED_TYPES[0]);

  const fetchMeasurements = useCallback(async () => {
    try {
      const res = await fetch('/api/measurements');
      if (res.ok) {
        const data = await res.json();
        setMeasurements(data);
      }
    } catch {
      // Silently handle errors in local mode
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const type = useCustomType ? customType.trim().toLowerCase().replace(/\s+/g, '_') : selectedType;
    if (!type || !value) return;

    const payload = {
      measurement_type: type,
      value: parseFloat(value),
      unit,
      measured_at: new Date(date).toISOString(),
    };

    if (editingId) {
      await fetch('/api/measurements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...payload }),
      });
      setEditingId(null);
    } else {
      await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setValue('');
    setCustomType('');
    setUseCustomType(false);
    setDate(new Date().toISOString().split('T')[0]);
    fetchMeasurements();
  };

  const handleEdit = (m: Measurement) => {
    setEditingId(m.id);
    const isPredefined = PREDEFINED_TYPES.includes(m.measurement_type);
    if (isPredefined) {
      setUseCustomType(false);
      setSelectedType(m.measurement_type);
    } else {
      setUseCustomType(true);
      setCustomType(m.measurement_type.replace(/_/g, ' '));
    }
    setValue(String(m.value));
    setUnit(m.unit as 'in' | 'cm');
    setDate(m.measured_at.split('T')[0]);
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/measurements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchMeasurements();
  };

  // Group measurements by date
  const grouped = useMemo(() => {
    const groups: Record<string, Measurement[]> = {};
    const sorted = [...measurements].sort(
      (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
    );
    for (const m of sorted) {
      const dateKey = new Date(m.measured_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(m);
    }
    return groups;
  }, [measurements]);

  // Get all unique measurement types for the chart dropdown
  const allTypes = useMemo(() => {
    const types = new Set<string>();
    for (const m of measurements) types.add(m.measurement_type);
    for (const t of PREDEFINED_TYPES) types.add(t);
    return Array.from(types);
  }, [measurements]);

  // Data for the trend chart (last 3 months)
  const chartData = useMemo(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return measurements
      .filter(
        (m) =>
          m.measurement_type === chartType &&
          new Date(m.measured_at) >= threeMonthsAgo,
      )
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  }, [measurements, chartType]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Body Measurements</h1>

      {/* Measurement Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          {editingId ? 'Edit Measurement' : 'Log Measurement'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3 items-end flex-wrap">
            {/* Type selector */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              {useCustomType ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Custom type..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setUseCustomType(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {PREDEFINED_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {formatType(t)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setUseCustomType(true)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 whitespace-nowrap"
                  >
                    + Custom
                  </button>
                </div>
              )}
            </div>

            {/* Value */}
            <div className="w-28">
              <label className="block text-xs text-gray-500 mb-1">Value</label>
              <input
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.0"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Unit toggle */}
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setUnit('in')}
                  className={`flex-1 py-2 text-xs font-medium ${
                    unit === 'in'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  in
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  className={`flex-1 py-2 text-xs font-medium ${
                    unit === 'cm'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  cm
                </button>
              </div>
            </div>

            {/* Date */}
            <div className="w-40">
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            >
              {editingId ? 'Update' : 'Log'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setValue('');
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Trend Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">Trend</h2>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
          >
            {allTypes.map((t) => (
              <option key={t} value={t}>
                {formatType(t)}
              </option>
            ))}
          </select>
        </div>

        {chartData.length < 2 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Need at least 2 entries for {formatType(chartType)} to show a trend.
          </p>
        ) : (
          <TrendChart data={chartData} />
        )}
      </div>

      {/* Measurement History */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">History</h2>
        {Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No measurements logged yet.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([dateKey, entries]) => (
              <div key={dateKey}>
                <div className="text-xs font-medium text-gray-500 mb-2">{dateKey}</div>
                <div className="divide-y divide-gray-100">
                  {entries.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatType(m.measurement_type)}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {m.value} {m.unit}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(m)}
                          className="text-xs text-indigo-500 hover:text-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: Measurement[] }) {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 600;
  const height = 160;
  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - ((d.value - min) / range) * chartH,
    label: d.value,
    date: new Date(d.measured_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const change = last - first;
  const changeStr = `${change >= 0 ? '+' : ''}${change.toFixed(1)} ${data[0].unit}`;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500">
          {first.toFixed(1)} → {last.toFixed(1)} {data[0].unit}
        </span>
        <span
          className={`text-xs font-medium ${
            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          ({changeStr})
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padY + chartH - frac * chartH;
          const val = min + frac * range;
          return (
            <g key={frac}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text
                x={padX - 4}
                y={y + 3}
                textAnchor="end"
                className="fill-gray-400"
                fontSize="10"
              >
                {val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Line */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#6366f1" />
            {/* Show date labels for first, last, and every 4th point */}
            {(i === 0 || i === points.length - 1 || i % 4 === 0) && (
              <text
                x={p.x}
                y={height - 2}
                textAnchor="middle"
                className="fill-gray-400"
                fontSize="9"
              >
                {p.date}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
