'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

interface PhotoMeta {
  id: string;
  user_id: string;
  photo_uri: string;
  view_type: 'front' | 'side' | 'back';
  notes: string | null;
  taken_at: string;
}

type ViewType = 'front' | 'side' | 'back';

export default function PhotosPage() {
  const [photos, setPhotos] = useState<PhotoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload form
  const [viewType, setViewType] = useState<ViewType>('front');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Comparison mode
  const [comparing, setComparing] = useState(false);
  const [compareDate1, setCompareDate1] = useState('');
  const [compareDate2, setCompareDate2] = useState('');
  const [compareView, setCompareView] = useState<ViewType>('front');

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch('/api/photos');
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Read file as base64 data URI
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_uri: dataUri,
          view_type: viewType,
          notes: notes.trim() || null,
          taken_at: new Date(date).toISOString(),
        }),
      });

      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      if (fileRef.current) fileRef.current.value = '';
      fetchPhotos();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchPhotos();
  };

  // Group photos by date
  const grouped = useMemo(() => {
    const groups: Record<string, PhotoMeta[]> = {};
    const sorted = [...photos].sort(
      (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime(),
    );
    for (const p of sorted) {
      const dateKey = new Date(p.taken_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(p);
    }
    return groups;
  }, [photos]);

  // Unique dates for comparison
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    for (const p of photos) {
      dates.add(p.taken_at.split('T')[0]);
    }
    return Array.from(dates).sort().reverse();
  }, [photos]);

  // Photos for comparison
  const comparePhotos1 = useMemo(
    () =>
      photos.filter(
        (p) => p.taken_at.startsWith(compareDate1) && p.view_type === compareView,
      ),
    [photos, compareDate1, compareView],
  );

  const comparePhotos2 = useMemo(
    () =>
      photos.filter(
        (p) => p.taken_at.startsWith(compareDate2) && p.view_type === compareView,
      ),
    [photos, compareDate2, compareView],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Progress Photos</h1>
        {photos.length >= 2 && (
          <button
            onClick={() => setComparing(!comparing)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              comparing
                ? 'bg-gray-200 text-gray-700'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            }`}
          >
            {comparing ? 'Exit Compare' : 'Compare'}
          </button>
        )}
      </div>

      {/* Comparison Mode */}
      {comparing && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Side-by-Side Comparison</h2>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date 1</label>
              <select
                value={compareDate1}
                onChange={(e) => setCompareDate1(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">Select date</option>
                {uniqueDates.map((d) => (
                  <option key={d} value={d}>
                    {new Date(d).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date 2</label>
              <select
                value={compareDate2}
                onChange={(e) => setCompareDate2(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">Select date</option>
                {uniqueDates.map((d) => (
                  <option key={d} value={d}>
                    {new Date(d).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">View</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {(['front', 'side', 'back'] as ViewType[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setCompareView(v)}
                    className={`px-3 py-1.5 text-xs font-medium capitalize ${
                      compareView === v
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {compareDate1 && compareDate2 ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2 text-center">
                  {new Date(compareDate1).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                {comparePhotos1.length > 0 ? (
                  comparePhotos1.map((p) => (
                    <img
                      key={p.id}
                      src={p.photo_uri}
                      alt={`${p.view_type} view`}
                      className="w-full rounded-lg object-cover"
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-48 rounded-lg bg-gray-100 text-sm text-gray-400">
                    No {compareView} photo
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 text-center">
                  {new Date(compareDate2).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                {comparePhotos2.length > 0 ? (
                  comparePhotos2.map((p) => (
                    <img
                      key={p.id}
                      src={p.photo_uri}
                      alt={`${p.view_type} view`}
                      className="w-full rounded-lg object-cover"
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-48 rounded-lg bg-gray-100 text-sm text-gray-400">
                    No {compareView} photo
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              Select two dates above to compare.
            </p>
          )}
        </div>
      )}

      {/* Upload Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Add Photo</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">View</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {(['front', 'side', 'back'] as ViewType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewType(v)}
                  className={`px-3 py-2 text-xs font-medium capitalize ${
                    viewType === v
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. End of cut, week 8..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Photo</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileSelect}
              disabled={uploading}
              className="text-sm text-gray-500 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-600 disabled:opacity-50"
            />
          </div>
        </div>
        {uploading && (
          <p className="text-xs text-gray-400 mt-2">Saving photo...</p>
        )}
      </div>

      {/* Photo Timeline */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-400 py-8 text-center">
            No progress photos yet. Take your first photo above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, datePhotos]) => (
            <div key={dateKey}>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{dateKey}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {datePhotos.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden group relative"
                  >
                    <img
                      src={p.photo_uri}
                      alt={`${p.view_type} view`}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="p-2">
                      <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize">
                        {p.view_type}
                      </span>
                      {p.notes && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete photo"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
