import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Body, { type ExtendedBodyPart } from 'react-native-body-highlighter';
import {
  Category,
  type Exercise,
  MuscleGroup,
  SLUG_TO_MUSCLE_GROUP,
  MUSCLE_GROUP_TO_SLUGS,
  muscleGroupLabel,
  getFilteredExercises,
} from '@myworkouts/shared';
import { useExerciseStore } from '../../lib/exercise-store';
import { supabase } from '../../lib/supabase';

const CATEGORIES: Array<{ value: Category | null; label: string }> = [
  { value: null, label: 'All' },
  { value: Category.Strength, label: 'Strength' },
  { value: Category.Cardio, label: 'Cardio' },
  { value: Category.Mobility, label: 'Mobility' },
  { value: Category.Fascia, label: 'Fascia' },
  { value: Category.Recovery, label: 'Recovery' },
  { value: Category.Flexibility, label: 'Flexibility' },
  { value: Category.Balance, label: 'Balance' },
];

const DIFFICULTY_DOTS: Record<string, string> = {
  beginner: '\u25CF\u25CB\u25CB',
  intermediate: '\u25CF\u25CF\u25CB',
  advanced: '\u25CF\u25CF\u25CF',
};

const CATEGORY_ICONS: Record<string, string> = {
  strength: '\uD83D\uDCAA',
  cardio: '\uD83C\uDFC3',
  mobility: '\uD83E\uDDD8',
  fascia: '\uD83E\uDEE8',
  recovery: '\uD83D\uDE4F',
  flexibility: '\uD83E\uDD38',
  balance: '\u2696\uFE0F',
};

function formatMuscleGroups(groups: string[], max = 3): string {
  const labels = groups.map((g) =>
    g.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
  if (labels.length <= max) return labels.join(', ');
  return labels.slice(0, max).join(', ') + ` +${labels.length - max} more`;
}

export default function ExploreScreen() {
  const router = useRouter();
  const store = useExerciseStore();
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [searchInput, setSearchInput] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => getFilteredExercises(store), [
    store.exercises,
    store.selectedMuscles,
    store.selectedCategory,
    store.searchQuery,
  ]);

  // Load exercises from Supabase on mount
  useEffect(() => {
    if (store.exercises.length > 0) return;
    supabase
      .from('exercises')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) store.setExercises(data as Exercise[]);
      });
  }, []);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        store.setSearchQuery(value);
      }, 300);
    },
    [store]
  );

  // Body map press handler
  const handleBodyPartPress = useCallback(
    (bodyPart: ExtendedBodyPart) => {
      if (!bodyPart.slug) return;
      const group = SLUG_TO_MUSCLE_GROUP[bodyPart.slug];
      if (group) {
        store.toggleMuscle(group);
      }
    },
    [store]
  );

  // Build highlight data for body map
  const highlightData: ExtendedBodyPart[] = store.selectedMuscles.flatMap((group) => {
    const slugs = MUSCLE_GROUP_TO_SLUGS[group] ?? [];
    return slugs.map((slug) => ({
      slug: slug as any,
      intensity: 2,
      color: '#6366F1',
    }));
  });

  const renderExerciseCard = useCallback(
    ({ item: exercise }: { item: Exercise }) => (
      <Pressable
        onPress={() => router.push(`/exercise/${exercise.id}` as any)}
        className="mb-2 flex-row items-center rounded-xl border border-gray-200 bg-white p-3"
      >
        {/* Thumbnail */}
        <View className="mr-3 h-14 w-14 items-center justify-center rounded-lg bg-gray-100">
          <Text className="text-xl">
            {CATEGORY_ICONS[exercise.category] ?? '\uD83C\uDFCB\uFE0F'}
          </Text>
        </View>
        {/* Text */}
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{exercise.name}</Text>
          <Text className="text-xs text-gray-500">
            {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
            {' \u00B7 '}
            {DIFFICULTY_DOTS[exercise.difficulty]}{' '}
            {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
          </Text>
          <Text className="text-xs text-gray-400">
            {formatMuscleGroups(exercise.muscle_groups)}
          </Text>
        </View>
      </Pressable>
    ),
    [router]
  );

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseCard}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            {/* Front/Back Toggle */}
            <View className="my-4 flex-row items-center justify-center">
              <View className="flex-row overflow-hidden rounded-lg border border-gray-200">
                <TouchableOpacity
                  onPress={() => setSide('front')}
                  className={`px-6 py-2 ${side === 'front' ? 'bg-indigo-500' : 'bg-white'}`}
                >
                  <Text className={`text-sm font-medium ${side === 'front' ? 'text-white' : 'text-gray-600'}`}>
                    FRONT
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSide('back')}
                  className={`px-6 py-2 ${side === 'back' ? 'bg-indigo-500' : 'bg-white'}`}
                >
                  <Text className={`text-sm font-medium ${side === 'back' ? 'text-white' : 'text-gray-600'}`}>
                    BACK
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Body Map */}
            <View className="items-center">
              <Body
                data={highlightData}
                side={side}
                onBodyPartPress={handleBodyPartPress}
                colors={['#6366F1', '#818CF8']}
                scale={0.75}
                border="#E5E7EB"
              />
            </View>

            {/* Selected Muscles Chip Bar */}
            <View className="mt-3 flex-row flex-wrap items-center gap-2 min-h-[36px]">
              {store.selectedMuscles.length === 0 ? (
                <Text className="text-sm text-gray-400">All Muscles</Text>
              ) : (
                <>
                  {store.selectedMuscles.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => store.toggleMuscle(m)}
                      className="flex-row items-center gap-1 rounded-full bg-indigo-100 px-3 py-1"
                    >
                      <Text className="text-sm font-medium text-indigo-700">
                        {muscleGroupLabel(m)}
                      </Text>
                      <Text className="text-xs text-indigo-700">{'\u2715'}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={store.clearMuscles}>
                    <Text className="text-xs text-gray-400 underline">Clear all</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3 mb-3"
              contentContainerStyle={{ gap: 8 }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = store.selectedCategory === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    onPress={() => store.setCategory(isActive ? null : cat.value)}
                    className={`rounded-full px-4 py-1.5 ${
                      isActive ? 'bg-indigo-500' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search Bar */}
            <TextInput
              value={searchInput}
              onChangeText={handleSearchChange}
              placeholder="Search exercises..."
              placeholderTextColor="#9CA3AF"
              className="mb-3 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900"
            />

            {/* Empty States */}
            {filtered.length === 0 && store.exercises.length > 0 && (
              <Text className="py-8 text-center text-gray-400">
                No exercises match your filters.
              </Text>
            )}
            {store.exercises.length === 0 && (
              <Text className="py-8 text-center text-gray-400">Loading exercises...</Text>
            )}
          </View>
        }
      />
    </View>
  );
}
