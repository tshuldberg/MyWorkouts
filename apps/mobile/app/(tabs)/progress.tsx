import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import type { WorkoutSession, Exercise } from '@myworkouts/shared';
import {
  calculateStreaks,
  calculateVolume,
  calculatePersonalRecords,
  getWeeklySummaries,
  buildHistory,
} from '@myworkouts/shared';
import { supabase } from '../../lib/supabase';

export default function ProgressScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutTitles, setWorkoutTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const [sessionsRes, exercisesRes, workoutsRes] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false }),
      supabase.from('exercises').select('*'),
      supabase.from('workouts').select('id, title'),
    ]);

    if (sessionsRes.data) setSessions(sessionsRes.data as WorkoutSession[]);
    if (exercisesRes.data) setExercises(exercisesRes.data as Exercise[]);
    if (workoutsRes.data) {
      const titles: Record<string, string> = {};
      for (const w of workoutsRes.data as { id: string; title: string }[]) {
        titles[w.id] = w.title;
      }
      setWorkoutTitles(titles);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exerciseMap = useMemo(() => {
    const map: Record<string, Exercise> = {};
    for (const e of exercises) map[e.id] = e;
    return map;
  }, [exercises]);

  const streaks = useMemo(() => calculateStreaks(sessions), [sessions]);
  const volume = useMemo(() => calculateVolume(sessions, exerciseMap), [sessions, exerciseMap]);
  const personalRecords = useMemo(
    () => calculatePersonalRecords(sessions, exerciseMap),
    [sessions, exerciseMap],
  );
  const weeklySummaries = useMemo(() => getWeeklySummaries(sessions, 6), [sessions]);
  const history = useMemo(() => buildHistory(sessions, workoutTitles), [sessions, workoutTitles]);

  const muscleGroupEntries = useMemo(() => {
    return Object.entries(volume.byMuscleGroup).sort((a, b) => b[1] - a[1]);
  }, [volume]);
  const maxMuscleCount = muscleGroupEntries.length > 0 ? muscleGroupEntries[0][1] : 1;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

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
      <View className="px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-900">Progress</Text>
        <Text className="text-sm text-gray-400 mt-1">
          Track your workout history and streaks
        </Text>
      </View>

      {sessions.length === 0 ? (
        <View className="items-center py-12">
          <Text className="text-gray-500">No workout history yet.</Text>
          <Text className="text-sm text-gray-400 mt-2">
            Complete a workout to start tracking progress.
          </Text>
        </View>
      ) : (
        <>
          {/* Stats Cards */}
          <View className="px-4 mt-4 flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[45%] rounded-xl border border-gray-200 bg-white p-3">
              <Text className="text-xs text-gray-500">Current Streak</Text>
              <View className="flex-row items-baseline gap-1 mt-1">
                <Text className={`text-2xl font-bold ${streaks.current > 0 ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {streaks.current}
                </Text>
                <Text className="text-sm text-gray-400">days</Text>
              </View>
            </View>
            <View className="flex-1 min-w-[45%] rounded-xl border border-gray-200 bg-white p-3">
              <Text className="text-xs text-gray-500">Longest Streak</Text>
              <View className="flex-row items-baseline gap-1 mt-1">
                <Text className="text-2xl font-bold text-gray-900">{streaks.longest}</Text>
                <Text className="text-sm text-gray-400">days</Text>
              </View>
            </View>
            <View className="flex-1 min-w-[45%] rounded-xl border border-gray-200 bg-white p-3">
              <Text className="text-xs text-gray-500">Total Workouts</Text>
              <Text className="text-2xl font-bold text-gray-900 mt-1">
                {volume.totalSessions}
              </Text>
            </View>
            <View className="flex-1 min-w-[45%] rounded-xl border border-gray-200 bg-white p-3">
              <Text className="text-xs text-gray-500">Total Time</Text>
              <View className="flex-row items-baseline gap-1 mt-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {volume.totalDurationMinutes}
                </Text>
                <Text className="text-sm text-gray-400">min</Text>
              </View>
            </View>
          </View>

          {/* Weekly Activity */}
          <View className="mx-4 mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <Text className="text-sm font-medium text-gray-700 mb-3">Weekly Activity</Text>
            <View className="flex-row items-end h-24 gap-1">
              {weeklySummaries
                .slice()
                .reverse()
                .map((week, i) => {
                  const maxSessions = Math.max(...weeklySummaries.map((w) => w.sessions), 1);
                  const heightPercent = week.sessions > 0
                    ? Math.max((week.sessions / maxSessions) * 100, 10)
                    : 5;
                  return (
                    <View key={i} className="flex-1 items-center">
                      <View
                        className={`w-full rounded-t ${
                          week.sessions > 0 ? 'bg-indigo-500' : 'bg-gray-100'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <Text className="text-[9px] text-gray-400 mt-1" numberOfLines={1}>
                        {week.label}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>

          {/* Volume by Muscle Group */}
          {muscleGroupEntries.length > 0 && (
            <View className="mx-4 mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">
                Volume by Muscle Group
              </Text>
              {muscleGroupEntries.slice(0, 6).map(([group, count]) => (
                <View key={group} className="flex-row items-center gap-2 mb-2">
                  <Text className="text-xs text-gray-500 w-20 text-right capitalize">
                    {group.replace('_', ' ')}
                  </Text>
                  <View className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <View
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${(count / maxMuscleCount) * 100}%` }}
                    />
                  </View>
                  <Text className="text-xs text-gray-400 w-6">{count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <View className="mx-4 mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">Personal Records</Text>
              {personalRecords.slice(0, 5).map((pr) => (
                <View
                  key={pr.exerciseId}
                  className="flex-row items-center justify-between py-2 border-b border-gray-50"
                >
                  <View>
                    <Text className="text-sm font-medium text-gray-900">
                      {pr.exerciseName}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {new Date(pr.achievedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-row gap-3">
                    <Text className="text-xs text-gray-600">
                      <Text className="font-medium text-gray-900">{pr.maxSets}</Text> sets
                    </Text>
                    <Text className="text-xs text-gray-600">
                      <Text className="font-medium text-gray-900">{pr.maxReps}</Text> reps
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Workout History */}
          <View className="mx-4 mt-4 mb-4 rounded-xl border border-gray-200 bg-white p-4">
            <Text className="text-sm font-medium text-gray-700 mb-3">Recent Workouts</Text>
            {history.length === 0 ? (
              <Text className="text-sm text-gray-400 py-4 text-center">
                No completed workouts yet.
              </Text>
            ) : (
              history.slice(0, 15).map((entry) => (
                <View
                  key={entry.sessionId}
                  className="flex-row items-center justify-between py-2.5 border-b border-gray-50"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">
                      {entry.workoutTitle}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View className="flex-row gap-3">
                    <Text className="text-xs text-gray-500">{entry.durationMinutes}m</Text>
                    <Text className="text-xs text-gray-500">{entry.totalReps} reps</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
