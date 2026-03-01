'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { RoutineTemplate, WorkoutExercise } from '@myworkouts/shared';

interface TemplateRow {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  exercises: string;
  difficulty: string;
  is_public: number;
  clone_count: number;
  created_at: string;
}

function rowToTemplate(row: TemplateRow): RoutineTemplate {
  let exercises: WorkoutExercise[] = [];
  try {
    exercises = JSON.parse(row.exercises);
  } catch {
    exercises = [];
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    creatorId: row.creator_id,
    exercises,
    difficulty: row.difficulty,
    isPublic: !!row.is_public,
    cloneCount: row.clone_count,
    createdAt: row.created_at,
  };
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data: TemplateRow[] = await response.json();
          setTemplates(data.map(rowToTemplate));
        }
      } catch {
        // Silently fail in local mode
      }
      setLoading(false);
    })();
  }, []);

  const filtered = templates.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      difficultyFilter === 'all' || t.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const myTemplates = filtered.filter((t) => !t.isPublic || t.creatorId === 'local-user');
  const communityTemplates = filtered.filter(
    (t) => t.isPublic && t.creatorId !== 'local-user',
  );

  const handleClone = async (template: RoutineTemplate) => {
    try {
      const response = await fetch('/api/templates/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      });
      if (response.ok) {
        const { workoutId } = await response.json();
        router.push(`/workouts`);
      }
    } catch {
      // Fallback: navigate to builder with template data
      router.push(`/workouts/builder`);
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Save and reuse your favorite workout routines
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="text-gray-500 mb-2">No templates yet.</p>
          <p className="text-sm text-gray-400">
            Create a workout and save it as a template to get started.
          </p>
        </div>
      ) : (
        <>
          {/* My Templates */}
          {myTemplates.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">My Templates</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {myTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClone={handleClone}
                    isOwn
                  />
                ))}
              </div>
            </section>
          )}

          {/* Community Templates */}
          {communityTemplates.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Community Templates</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {communityTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClone={handleClone}
                    isOwn={false}
                  />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && templates.length > 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500">No templates match your filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onClone,
  isOwn,
}: {
  template: RoutineTemplate;
  onClone: (t: RoutineTemplate) => void;
  isOwn: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors">
      <Link href={`/templates/${template.id}`} className="block">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{template.title}</h3>
        {template.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{template.description}</p>
        )}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
              difficultyColors[template.difficulty] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
          </span>
          <span className="text-[10px] text-gray-400">
            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
          </span>
          {template.cloneCount > 0 && (
            <span className="text-[10px] text-gray-400">
              {template.cloneCount} clone{template.cloneCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </Link>
      <button
        type="button"
        onClick={() => onClone(template)}
        className="w-full rounded-lg border border-indigo-500 py-1.5 text-xs font-medium text-indigo-500 hover:bg-indigo-50 transition-colors"
      >
        Clone to My Workouts
      </button>
    </div>
  );
}
