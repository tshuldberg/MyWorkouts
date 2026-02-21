import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { WorkoutSession } from '@myworkouts/shared';
import { calculateStreaks } from '@myworkouts/shared';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const [sessionsRes, profileRes] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50),
      (supabase as any)
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .single(),
    ]);

    if (sessionsRes.data) setSessions(sessionsRes.data as WorkoutSession[]);
    if ((profileRes as any).data?.display_name) {
      setDisplayName((profileRes as any).data.display_name);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const streaks = calculateStreaks(sessions);
  const completedCount = sessions.filter((s) => s.completed_at).length;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
        />
      }
    >
      {/* Greeting */}
      <View className="px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900">
          {displayName ? `Hey, ${displayName}` : 'Welcome back'}
        </Text>
        <Text className="text-sm text-gray-400 mt-1">
          {streaks.current > 0
            ? `${streaks.current}-day streak! Keep it going.`
            : 'Ready to work out?'}
        </Text>
      </View>

      {/* Quick Stats */}
      {!loading && (
        <View className="px-4 flex-row gap-3 mb-4">
          <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
            <Text className="text-xs text-gray-500">Streak</Text>
            <Text className={`text-xl font-bold mt-0.5 ${streaks.current > 0 ? 'text-indigo-600' : 'text-gray-900'}`}>
              {streaks.current} days
            </Text>
          </View>
          <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
            <Text className="text-xs text-gray-500">Workouts</Text>
            <Text className="text-xl font-bold text-gray-900 mt-0.5">
              {completedCount}
            </Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View className="px-4 gap-3">
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/explore')}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <Text className="font-semibold text-gray-900">Explore Exercises</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Browse by muscle group with the body map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/workouts')}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <Text className="font-semibold text-gray-900">My Workouts</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Start or build a custom workout routine
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/progress')}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <Text className="font-semibold text-gray-900">View Progress</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Streaks, volume, and personal records
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/plans' as any)}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <Text className="font-semibold text-gray-900">Workout Plans</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Multi-week programs from your coach
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
