import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  type Exercise,
  type Workout,
  Difficulty,
  estimateDuration,
  toWorkoutPayload,
} from '@myworkouts/shared';
import { useWorkoutBuilderStore } from '../../lib/workout-builder-store';
import { useExerciseStore } from '../../lib/exercise-store';
import { supabase } from '../../lib/supabase';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

const DIFFICULTIES: Difficulty[] = [Difficulty.Beginner, Difficulty.Intermediate, Difficulty.Advanced];

export default function WorkoutBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const editId = params.edit;

  const builder = useWorkoutBuilderStore();
  const exerciseStore = useExerciseStore();
  const [showPicker, setShowPicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Load exercises if needed
  useEffect(() => {
    if (exerciseStore.exercises.length > 0) return;
    supabase
      .from('exercises')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) exerciseStore.setExercises(data as Exercise[]);
      });
  }, []);

  // Load workout for editing
  useEffect(() => {
    if (!editId) {
      builder.reset();
      return;
    }
    supabase
      .from('workouts')
      .select('*')
      .eq('id', editId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const workout = data as Workout;
        const names: Record<string, string> = {};
        for (const e of exerciseStore.exercises) {
          names[e.id] = e.name;
        }
        builder.loadWorkout(workout, names);
      });
  }, [editId, exerciseStore.exercises.length]);

  const filteredExercises = useMemo(() => {
    if (exerciseSearch.length < 2) return exerciseStore.exercises;
    const q = exerciseSearch.toLowerCase();
    return exerciseStore.exercises.filter(
      (e) => e.name.toLowerCase().includes(q) || e.category.includes(q)
    );
  }, [exerciseStore.exercises, exerciseSearch]);

  const duration = useMemo(() => estimateDuration(builder.exercises), [builder.exercises]);

  const handleSave = useCallback(async () => {
    if (!builder.title.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const payload = toWorkoutPayload(builder, user.id);

    if (builder.isEditing && builder.editingWorkoutId) {
      await (supabase.from('workouts') as any)
        .update(payload)
        .eq('id', builder.editingWorkoutId);
    } else {
      await (supabase.from('workouts') as any).insert(payload);
    }

    builder.reset();
    setSaving(false);
    router.back();
  }, [builder, router]);

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <Text className="text-2xl font-bold text-gray-900">
            {builder.isEditing ? 'Edit Workout' : 'New Workout'}
          </Text>
          <TouchableOpacity onPress={() => { builder.reset(); router.back(); }}>
            <Text className="text-sm text-gray-500">Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Workout Info */}
        <TextInput
          value={builder.title}
          onChangeText={builder.setTitle}
          placeholder="Workout name"
          placeholderTextColor="#9CA3AF"
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 mb-3"
        />
        <TextInput
          value={builder.description}
          onChangeText={builder.setDescription}
          placeholder="Description (optional)"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={2}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 mb-3"
        />

        {/* Difficulty Pills */}
        <View className="flex-row gap-2 mb-4">
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => builder.setDifficulty(d)}
              className={`rounded-full px-4 py-1.5 ${
                builder.difficulty === d ? 'bg-indigo-500' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  builder.difficulty === d ? 'text-white' : 'text-gray-600'
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Exercise List Header */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900">
            Exercises ({builder.exercises.length})
          </Text>
          <Text className="text-sm text-gray-400">
            Est. {formatDuration(duration)}
          </Text>
        </View>

        {builder.exercises.length === 0 && (
          <View className="items-center py-8 border border-dashed border-gray-200 rounded-xl mb-4">
            <Text className="text-gray-400">No exercises added yet.</Text>
          </View>
        )}

        {/* Exercise Items */}
        {builder.exercises.map((ex, i) => (
          <View
            key={`${ex.exercise_id}-${i}`}
            className="rounded-xl border border-gray-200 bg-white p-4 mb-2"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-gray-400 font-mono">{i + 1}.</Text>
                <Text className="font-medium text-gray-900">{ex.name}</Text>
              </View>
              <View className="flex-row items-center gap-3">
                {i > 0 && (
                  <TouchableOpacity onPress={() => builder.moveExercise(i, i - 1)}>
                    <Text className="text-gray-400">{'\u25B2'}</Text>
                  </TouchableOpacity>
                )}
                {i < builder.exercises.length - 1 && (
                  <TouchableOpacity onPress={() => builder.moveExercise(i, i + 1)}>
                    <Text className="text-gray-400">{'\u25BC'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => builder.removeExercise(i)}>
                  <Text className="text-red-400 text-sm">Remove</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sets / Reps / Rest */}
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Text className="text-xs text-gray-400 mb-1">Sets</Text>
                <TextInput
                  value={String(ex.sets)}
                  onChangeText={(v) =>
                    builder.updateExercise(i, { sets: Math.max(1, parseInt(v) || 1) })
                  }
                  keyboardType="number-pad"
                  className="rounded border border-gray-200 px-2 py-1 text-sm text-center"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-400 mb-1">Reps</Text>
                <TextInput
                  value={ex.reps != null ? String(ex.reps) : ''}
                  onChangeText={(v) =>
                    builder.updateExercise(i, { reps: parseInt(v) || null })
                  }
                  keyboardType="number-pad"
                  placeholder="-"
                  placeholderTextColor="#9CA3AF"
                  className="rounded border border-gray-200 px-2 py-1 text-sm text-center"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-400 mb-1">Dur (s)</Text>
                <TextInput
                  value={ex.duration != null ? String(ex.duration) : ''}
                  onChangeText={(v) =>
                    builder.updateExercise(i, { duration: parseInt(v) || null })
                  }
                  keyboardType="number-pad"
                  placeholder="-"
                  placeholderTextColor="#9CA3AF"
                  className="rounded border border-gray-200 px-2 py-1 text-sm text-center"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-400 mb-1">Rest (s)</Text>
                <TextInput
                  value={String(ex.rest_after)}
                  onChangeText={(v) =>
                    builder.updateExercise(i, { rest_after: Math.max(0, parseInt(v) || 0) })
                  }
                  keyboardType="number-pad"
                  className="rounded border border-gray-200 px-2 py-1 text-sm text-center"
                />
              </View>
            </View>
          </View>
        ))}

        {/* Add Exercise */}
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          className="border-2 border-dashed border-gray-300 rounded-lg py-3 items-center mt-2"
        >
          <Text className="text-sm font-medium text-gray-500">+ Add Exercise</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!builder.title.trim() || builder.exercises.length === 0 || saving}
          className={`mt-8 rounded-lg py-3 items-center ${
            builder.title.trim() && builder.exercises.length > 0 && !saving
              ? 'bg-indigo-500'
              : 'bg-gray-300'
          }`}
        >
          <Text className="font-semibold text-white">
            {saving ? 'Saving...' : builder.isEditing ? 'Update Workout' : 'Save Workout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-2xl max-h-[80%]">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Text className="font-semibold text-gray-900">Add Exercise</Text>
              <TouchableOpacity onPress={() => { setShowPicker(false); setExerciseSearch(''); }}>
                <Text className="text-gray-400">{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
            <View className="px-4 py-2 border-b border-gray-100">
              <TextInput
                value={exerciseSearch}
                onChangeText={setExerciseSearch}
                placeholder="Search exercises..."
                placeholderTextColor="#9CA3AF"
                autoFocus
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
              />
            </View>
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item: exercise }) => (
                <TouchableOpacity
                  onPress={() => {
                    builder.addExercise(exercise);
                    setShowPicker(false);
                    setExerciseSearch('');
                  }}
                  className="px-4 py-3 border-b border-gray-50"
                >
                  <Text className="font-medium text-gray-900 text-sm">{exercise.name}</Text>
                  <Text className="text-xs text-gray-500">
                    {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
                    {' \u00B7 '}
                    {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="py-8 text-center text-gray-400 text-sm">
                  No exercises found.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
