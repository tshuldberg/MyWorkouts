import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { WorkoutPlan } from '@myworkouts/shared';
import { getPlanProgress } from '@myworkouts/shared';
import { supabase } from '../../lib/supabase';

export default function PlansScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlans = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Fetch plans as coach or from user's coach
    const { data: coachPlans } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });

    if (coachPlans && coachPlans.length > 0) {
      setPlans(coachPlans as WorkoutPlan[]);
    } else {
      const { data: profile } = await (supabase as any)
        .from('users')
        .select('coach_id')
        .eq('id', user.id)
        .single();
      if ((profile as any)?.coach_id) {
        const { data: clientPlans } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('coach_id', (profile as any).coach_id)
          .order('created_at', { ascending: false });
        if (clientPlans) setPlans(clientPlans as WorkoutPlan[]);
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPlans(); }}
          />
        }
        ListHeaderComponent={
          <View className="py-4">
            <Text className="text-2xl font-bold text-gray-900">Workout Plans</Text>
            <Text className="text-sm text-gray-400 mt-1">
              Multi-week programs designed by your coach
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-12">
              <Text className="text-gray-500">No workout plans available.</Text>
              <Text className="text-sm text-gray-400 mt-2">
                Ask your coach to create a personalized plan.
              </Text>
            </View>
          ) : (
            <Text className="py-12 text-center text-gray-400">Loading...</Text>
          )
        }
        renderItem={({ item: plan }) => {
          const progress = getPlanProgress(plan, new Set());
          return (
            <TouchableOpacity
              onPress={() => router.push(`/plans/${plan.id}` as any)}
              className="mb-3 rounded-xl border border-gray-200 bg-white p-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{plan.title}</Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    {plan.weeks.length} weeks{' \u00B7 '}{progress.total} workouts
                  </Text>
                </View>
                {plan.is_premium && (
                  <View className="rounded-full bg-amber-100 px-2 py-0.5">
                    <Text className="text-xs font-medium text-amber-700">Premium</Text>
                  </View>
                )}
              </View>
              {/* Progress bar */}
              <View className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <View
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </View>
              <Text className="mt-1 text-xs text-gray-400">
                {progress.completed}/{progress.total} completed ({progress.percent}%)
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
