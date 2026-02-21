import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Workout } from '@myworkouts/shared';
import { supabase } from '../../lib/supabase';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export default function WorkoutsScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkouts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setWorkouts(data as Workout[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkouts();
  }, [fetchWorkouts]);

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View className="flex-row items-center justify-between py-4">
            <Text className="text-2xl font-bold text-gray-900">Workouts</Text>
            <TouchableOpacity
              onPress={() => router.push('/workouts/builder' as any)}
              className="rounded-lg bg-indigo-500 px-4 py-2"
            >
              <Text className="text-sm font-semibold text-white">+ New</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-12">
              <Text className="text-gray-500 mb-4">No custom workouts yet.</Text>
              <TouchableOpacity onPress={() => router.push('/workouts/builder' as any)}>
                <Text className="text-indigo-500">Create your first workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="py-12 text-center text-gray-400">Loading...</Text>
          )
        }
        renderItem={({ item: w }) => (
          <TouchableOpacity
            onPress={() => router.push(`/workouts/builder?edit=${w.id}` as any)}
            className="mb-2 rounded-xl border border-gray-200 bg-white p-4"
          >
            <Text className="font-semibold text-gray-900">{w.title}</Text>
            <Text className="text-xs text-gray-500 mt-1">
              {w.exercises.length} exercises{' \u00B7 '}
              {formatDuration(w.estimated_duration)}{' \u00B7 '}
              {w.difficulty.charAt(0).toUpperCase() + w.difficulty.slice(1)}
            </Text>
            {w.description ? (
              <Text className="text-xs text-gray-400 mt-1" numberOfLines={1}>
                {w.description}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
