import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  type Exercise,
  type Workout,
  playerProgress,
  formatTime,
  SPEED_OPTIONS,
} from '@myworkouts/shared';
import { usePlayerStore } from '../../lib/player-store';
import { supabase } from '../../lib/supabase';

export default function WorkoutPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { status, dispatch, init } = usePlayerStore();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});
  const [loading, setLoading] = useState(true);

  // Load workout
  useEffect(() => {
    supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) {
          setLoading(false);
          return;
        }
        const w = data as Workout;
        setWorkout(w);

        const exerciseIds = w.exercises.map((e) => e.exercise_id);
        if (exerciseIds.length > 0) {
          supabase
            .from('exercises')
            .select('*')
            .in('id', exerciseIds)
            .then(({ data: exData }) => {
              const map: Record<string, Exercise> = {};
              if (exData) {
                for (const e of exData as Exercise[]) {
                  map[e.id] = e;
                }
              }
              setExerciseMap(map);
              init(w.exercises);
              setLoading(false);
            });
        } else {
          init(w.exercises);
          setLoading(false);
        }
      });

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [id, init]);

  // Tick loop
  useEffect(() => {
    if (status.state === 'playing' || status.state === 'rest') {
      lastTickRef.current = Date.now();
      tickRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;
        dispatch({ type: 'TICK', deltaMs: delta });
      }, 100);
    } else {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [status.state, dispatch]);

  // Save session on completion
  useEffect(() => {
    if (status.state !== 'completed' || !workout) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      (supabase as any).from('workout_sessions').insert({
        user_id: user.id,
        workout_id: workout.id,
        exercises_completed: status.completed,
        completed_at: new Date().toISOString(),
      });
    });
  }, [status.state, workout, status.completed]);

  const currentExercise = status.exercises[status.currentExerciseIndex];
  const currentDetail = currentExercise ? exerciseMap[currentExercise.exercise_id] : null;
  const progress = playerProgress(status);

  const handlePlayPause = useCallback(() => {
    if (status.state === 'idle') dispatch({ type: 'START' });
    else if (status.state === 'playing') dispatch({ type: 'PAUSE' });
    else if (status.state === 'paused') dispatch({ type: 'RESUME' });
  }, [status.state, dispatch]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading workout...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Workout not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-indigo-500">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Completed Screen ──
  if (status.state === 'completed') {
    return (
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
        <Text className="text-6xl mt-8">&#127942;</Text>
        <Text className="text-2xl font-bold text-gray-900 mt-4">Workout Complete!</Text>
        <Text className="text-gray-500 mt-2">
          {workout.title} &middot; {formatTime(status.elapsedTime)}
        </Text>

        <View className="flex-row mt-8 gap-4">
          <View className="flex-1 items-center rounded-xl bg-indigo-50 p-4">
            <Text className="text-2xl font-bold text-indigo-600">{status.completed.length}</Text>
            <Text className="text-xs text-gray-500">Exercises</Text>
          </View>
          <View className="flex-1 items-center rounded-xl bg-green-50 p-4">
            <Text className="text-2xl font-bold text-green-600">
              {status.completed.reduce((s, c) => s + c.sets_completed, 0)}
            </Text>
            <Text className="text-xs text-gray-500">Total Sets</Text>
          </View>
          <View className="flex-1 items-center rounded-xl bg-amber-50 p-4">
            <Text className="text-2xl font-bold text-amber-600">{formatTime(status.elapsedTime)}</Text>
            <Text className="text-xs text-gray-500">Duration</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 rounded-lg bg-indigo-500 px-8 py-3"
        >
          <Text className="font-semibold text-white">Done</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Player Screen ──
  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-sm text-gray-500">{'\u25C0 Exit'}</Text>
          </TouchableOpacity>
          <Text className="font-semibold text-gray-900 flex-1 text-center mx-4" numberOfLines={1}>
            {workout.title}
          </Text>
          <Text className="text-sm text-gray-400">{formatTime(status.elapsedTime)}</Text>
        </View>

        {/* Progress Bar */}
        <View className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <View
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-xs text-gray-400">
            Exercise {Math.min(status.currentExerciseIndex + 1, status.exercises.length)} of{' '}
            {status.exercises.length}
          </Text>
          <Text className="text-xs text-gray-400">{Math.round(progress * 100)}%</Text>
        </View>

        {/* Rest Overlay */}
        {status.state === 'rest' && (
          <View className="mt-6 rounded-2xl bg-blue-50 border border-blue-200 p-8 items-center">
            <Text className="text-sm font-medium text-blue-600 uppercase tracking-wide">Rest</Text>
            <Text className="text-5xl font-bold text-blue-700 mt-2">
              {formatTime(status.restRemaining)}
            </Text>
            <Text className="mt-3 text-sm text-blue-500">
              Next: {currentDetail?.name ?? 'Next exercise'}
            </Text>
            <TouchableOpacity
              onPress={() => dispatch({ type: 'REST_COMPLETE' })}
              className="mt-4"
            >
              <Text className="text-sm text-blue-600 underline">Skip rest</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Exercise */}
        {status.state !== 'rest' && currentDetail && (
          <View className="mt-4">
            {/* Video Placeholder */}
            <View className="h-48 items-center justify-center rounded-xl bg-gray-100">
              <Text className="text-4xl">{'\u25B6\uFE0F'}</Text>
              <Text className="mt-2 text-sm text-gray-400">Video coming soon</Text>
            </View>

            {/* Exercise Info */}
            <Text className="text-2xl font-bold text-gray-900 mt-4">{currentDetail.name}</Text>
            <Text className="mt-1 text-sm text-gray-500">{currentDetail.description}</Text>

            {/* Set/Rep Counter */}
            <View className="flex-row mt-4 gap-4">
              <View className="flex-1 items-center rounded-xl bg-gray-100 py-3">
                <Text className="text-2xl font-bold text-gray-900">
                  {status.currentSet} / {currentExercise!.sets}
                </Text>
                <Text className="text-xs text-gray-500">Set</Text>
              </View>

              {currentExercise!.reps ? (
                <View className="flex-1 items-center rounded-xl bg-gray-100 py-3">
                  <Text className="text-2xl font-bold text-gray-900">
                    {status.currentRep} / {currentExercise!.reps}
                  </Text>
                  <Text className="text-xs text-gray-500">Reps</Text>
                </View>
              ) : currentExercise!.duration ? (
                <View className="flex-1 items-center rounded-xl bg-gray-100 py-3">
                  <Text className="text-2xl font-bold text-gray-900">
                    {formatTime(Math.max(0, (currentExercise!.duration * 1000) - status.exerciseElapsed))}
                  </Text>
                  <Text className="text-xs text-gray-500">Remaining</Text>
                </View>
              ) : null}
            </View>

            {/* Rep/Set Complete Buttons */}
            {currentExercise!.reps && status.state === 'playing' && (
              <View className="flex-row mt-4 gap-2">
                <TouchableOpacity
                  onPress={() => dispatch({ type: 'COMPLETE_REP' })}
                  className="flex-1 items-center rounded-lg border border-indigo-300 py-2"
                >
                  <Text className="text-sm font-medium text-indigo-600">+1 Rep</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => dispatch({ type: 'COMPLETE_SET' })}
                  className="flex-1 items-center rounded-lg bg-indigo-100 py-2"
                >
                  <Text className="text-sm font-medium text-indigo-700">Complete Set</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Transport Controls */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pb-10 pt-4">
        <View className="flex-row items-center justify-between">
          {/* Previous */}
          <TouchableOpacity
            onPress={() => dispatch({ type: 'PREVIOUS_EXERCISE' })}
            disabled={status.currentExerciseIndex === 0}
            className="p-3"
            style={{ opacity: status.currentExerciseIndex === 0 ? 0.3 : 1 }}
          >
            <Text className="text-2xl text-gray-500">{'\u25C0'}</Text>
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            onPress={handlePlayPause}
            className="h-16 w-16 items-center justify-center rounded-full bg-indigo-500"
          >
            <Text className="text-3xl text-white">
              {status.state === 'playing' ? '\u23F8' : '\u25B6'}
            </Text>
          </TouchableOpacity>

          {/* Next / Skip */}
          <TouchableOpacity
            onPress={() => dispatch({ type: 'SKIP_EXERCISE' })}
            disabled={status.currentExerciseIndex >= status.exercises.length}
            className="p-3"
            style={{ opacity: status.currentExerciseIndex >= status.exercises.length ? 0.3 : 1 }}
          >
            <Text className="text-2xl text-gray-500">{'\u25B6'}</Text>
          </TouchableOpacity>
        </View>

        {/* Speed Control */}
        <View className="flex-row items-center justify-center mt-3 gap-1">
          {SPEED_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() =>
                dispatch({
                  type: 'ADJUST_SPEED',
                  direction: s === 1.0 ? 'normal' : s > status.speed ? 'faster' : 'slower',
                })
              }
              className={`rounded-full px-3 py-1 ${
                Math.abs(status.speed - s) < 0.01
                  ? 'bg-indigo-500'
                  : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  Math.abs(status.speed - s) < 0.01
                    ? 'text-white'
                    : 'text-gray-500'
                }`}
              >
                {s}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
