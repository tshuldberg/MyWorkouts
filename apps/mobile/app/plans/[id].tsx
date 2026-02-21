import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  type WorkoutPlan,
  type Workout,
  DAY_NAMES,
  getPlanProgress,
} from '@myworkouts/shared';
import { supabase } from '../../lib/supabase';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [workoutNames, setWorkoutNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        const p = data as WorkoutPlan;
        setPlan(p);

        const workoutIds = new Set<string>();
        for (const week of p.weeks) {
          for (const day of week.days) {
            if (day.workout_id) workoutIds.add(day.workout_id);
          }
        }
        if (workoutIds.size > 0) {
          const { data: workouts } = await supabase
            .from('workouts')
            .select('id, title')
            .in('id', Array.from(workoutIds));
          if (workouts) {
            const names: Record<string, string> = {};
            for (const w of workouts as Workout[]) {
              names[w.id] = w.title;
            }
            setWorkoutNames(names);
          }
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const progress = useMemo(
    () => plan ? getPlanProgress(plan, new Set()) : { completed: 0, total: 0, percent: 0 },
    [plan]
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Plan not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-indigo-500">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Back */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="px-4 pt-4 pb-2 flex-row items-center"
      >
        <Text className="text-sm text-gray-500">{'\u25C0 Back'}</Text>
      </TouchableOpacity>

      {/* Header */}
      <View className="px-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900 flex-1">{plan.title}</Text>
          {plan.is_premium && (
            <View className="rounded-full bg-amber-100 px-2 py-0.5 ml-2">
              <Text className="text-xs font-medium text-amber-700">Premium</Text>
            </View>
          )}
        </View>
        <Text className="text-sm text-gray-500 mt-1">
          {plan.weeks.length} weeks{' \u00B7 '}{progress.total} workouts
        </Text>
      </View>

      {/* Overall Progress */}
      <View className="mx-4 mt-4 rounded-xl border border-gray-200 bg-white p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-medium text-gray-700">Overall Progress</Text>
          <Text className="text-sm text-gray-500">{progress.percent}%</Text>
        </View>
        <View className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <View
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${progress.percent}%` }}
          />
        </View>
        <Text className="mt-1 text-xs text-gray-400">
          {progress.completed} of {progress.total} workouts completed
        </Text>
      </View>

      {/* Weekly Calendar */}
      {plan.weeks.map((week, wi) => (
        <View key={wi} className="px-4 mt-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Week {week.week_number}
          </Text>
          {week.days.map((day, di) => (
            <View
              key={di}
              className={`mb-2 rounded-lg border p-3 ${
                day.rest_day
                  ? 'border-gray-100 bg-gray-50'
                  : day.workout_id
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-gray-200 bg-white'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-medium text-gray-500">
                  {DAY_NAMES[di]}
                </Text>
                {day.rest_day ? (
                  <Text className="text-xs text-gray-400">Rest</Text>
                ) : day.workout_id ? (
                  <Text className="text-xs font-medium text-indigo-700">
                    {workoutNames[day.workout_id] ?? 'Workout'}
                  </Text>
                ) : (
                  <Text className="text-xs text-gray-300">--</Text>
                )}
              </View>
              {day.notes && (
                <Text className="mt-1 text-xs text-gray-400">{day.notes}</Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
