import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  type WorkoutPlan,
  type Workout,
  DAY_NAMES,
  getPlanProgress,
  getCurrentPlanPosition,
  SubscriptionPlan,
} from '@myworkouts/shared';
import { supabase } from '../../lib/supabase';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [workoutNames, setWorkoutNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followStartDate, setFollowStartDate] = useState<string | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [followSaving, setFollowSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check subscription
        const { data: profile } = await (supabase as any)
          .from('users')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();
        if ((profile as any)?.subscription_tier === SubscriptionPlan.Premium) {
          setIsPremiumUser(true);
        }

        // Check if following
        const { data: sub } = await (supabase as any)
          .from('plan_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', id)
          .maybeSingle();
        if (sub) {
          setFollowing(true);
          setFollowStartDate((sub as any).started_at);
        }
      }

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
    [plan],
  );

  const planPosition = useMemo(() => {
    if (!plan || !followStartDate) return null;
    return getCurrentPlanPosition(plan, followStartDate);
  }, [plan, followStartDate]);

  const handleFollowPlan = useCallback(async () => {
    if (plan?.is_premium && !isPremiumUser) {
      router.push('/subscription' as any);
      return;
    }

    setFollowSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFollowSaving(false);
      return;
    }

    const startDate = new Date().toISOString();
    await (supabase as any).from('plan_subscriptions').insert({
      user_id: user.id,
      plan_id: id,
      started_at: startDate,
    });

    setFollowing(true);
    setFollowStartDate(startDate);
    setFollowSaving(false);
  }, [id, plan, isPremiumUser, router]);

  const handleUnfollow = useCallback(async () => {
    Alert.alert('Unfollow Plan', 'Stop following this plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: async () => {
          setFollowSaving(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setFollowSaving(false);
            return;
          }
          await (supabase as any)
            .from('plan_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('plan_id', id);
          setFollowing(false);
          setFollowStartDate(null);
          setFollowSaving(false);
        },
      },
    ]);
  }, [id]);

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

      {/* Follow / Unfollow */}
      <View className="mx-4 mt-4">
        {following ? (
          <View className="flex-row items-center gap-3">
            <View className="flex-1 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5">
              <Text className="text-sm font-medium text-green-700">Following</Text>
              {planPosition && !planPosition.isComplete && (
                <Text className="text-xs text-green-600 mt-0.5">
                  Week {planPosition.weekNumber}, {DAY_NAMES[planPosition.dayIndex]}
                </Text>
              )}
              {planPosition?.isComplete && (
                <Text className="text-xs text-green-600 mt-0.5">Completed!</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleUnfollow}
              disabled={followSaving}
              className="rounded-lg border border-gray-200 px-4 py-2.5"
            >
              <Text className="text-sm text-gray-600">Unfollow</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleFollowPlan}
            disabled={followSaving}
            className="rounded-lg bg-indigo-500 py-3 items-center"
            style={{ opacity: followSaving ? 0.5 : 1 }}
          >
            <Text className="font-semibold text-white">
              {followSaving
                ? 'Saving...'
                : plan.is_premium && !isPremiumUser
                  ? 'Upgrade to Premium to Follow'
                  : 'Follow This Plan'}
            </Text>
          </TouchableOpacity>
        )}
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
          {week.days.map((day, di) => {
            const isCurrent = planPosition
              && planPosition.weekNumber === week.week_number
              && planPosition.dayIndex === di;
            return (
              <View
                key={di}
                className={`mb-2 rounded-lg border p-3 ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-50'
                    : day.rest_day
                      ? 'border-gray-100 bg-gray-50'
                      : day.workout_id
                        ? 'border-indigo-200 bg-indigo-50'
                        : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-medium text-gray-500">
                      {DAY_NAMES[di]}
                    </Text>
                    {isCurrent && (
                      <View className="rounded-full bg-indigo-500 px-2 py-0.5">
                        <Text className="text-[10px] font-medium text-white">Today</Text>
                      </View>
                    )}
                  </View>
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
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
