import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Body from 'react-native-body-highlighter';
import {
  type Exercise,
  MuscleGroup,
  MUSCLE_GROUP_TO_SLUGS,
  muscleGroupLabel,
} from '@myworkouts/shared';
import { supabase } from '../../lib/supabase';

const DIFFICULTY_DOTS: Record<string, string> = {
  beginner: '\u25CF\u25CB\u25CB',
  intermediate: '\u25CF\u25CF\u25CB',
  advanced: '\u25CF\u25CF\u25CF',
};

function buildMiniMapData(muscles: string[], isPrimary: boolean) {
  return muscles.flatMap((m) => {
    const slugs = MUSCLE_GROUP_TO_SLUGS[m as MuscleGroup] ?? [];
    return slugs.map((slug) => ({
      slug: slug as any,
      intensity: isPrimary ? 2 : 1,
      color: isPrimary ? '#6366F1' : '#A5B4FC',
    }));
  });
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setExercise(data as Exercise);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Exercise not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-indigo-500">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const primaryMuscles = exercise.muscle_groups.slice(0, 1);
  const secondaryMuscles = exercise.muscle_groups.slice(1);
  const allMapData = [
    ...buildMiniMapData(primaryMuscles, true),
    ...buildMiniMapData(secondaryMuscles, false),
  ];

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="px-4 pt-4 pb-2 flex-row items-center"
      >
        <Text className="text-sm text-gray-500">{'\u25C0 Back'}</Text>
      </TouchableOpacity>

      {/* Video Placeholder */}
      <View className="mx-4 h-48 items-center justify-center rounded-xl bg-gray-100">
        <Text className="text-4xl">{'\u25B6\uFE0F'}</Text>
        <Text className="mt-2 text-sm text-gray-400">Coach video coming soon</Text>
      </View>

      {/* Exercise Info */}
      <View className="px-4 mt-4">
        <Text className="text-2xl font-bold text-gray-900">{exercise.name}</Text>
        <Text className="mt-1 text-sm text-gray-500">
          {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
          {' \u00B7 '}
          {DIFFICULTY_DOTS[exercise.difficulty]}{' '}
          {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
        </Text>
      </View>

      {/* Primary / Secondary Muscles */}
      <View className="px-4 mt-5 flex-row gap-4">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Primary
          </Text>
          {primaryMuscles.map((m) => (
            <Text key={m} className="mt-1 text-sm text-gray-700">
              {muscleGroupLabel(m as MuscleGroup)}
            </Text>
          ))}
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Secondary
          </Text>
          {secondaryMuscles.length > 0 ? (
            secondaryMuscles.map((m) => (
              <Text key={m} className="mt-1 text-sm text-gray-700">
                {muscleGroupLabel(m as MuscleGroup)}
              </Text>
            ))
          ) : (
            <Text className="mt-1 text-sm text-gray-400">None</Text>
          )}
        </View>
      </View>

      {/* Mini Body Maps */}
      <View className="mt-5 flex-row justify-center gap-4">
        <View className="items-center">
          <Text className="text-xs text-gray-400 mb-1">Front</Text>
          <Body
            data={allMapData}
            side="front"
            colors={['#A5B4FC', '#6366F1']}
            scale={0.35}
            border="#E5E7EB"
          />
        </View>
        <View className="items-center">
          <Text className="text-xs text-gray-400 mb-1">Back</Text>
          <Body
            data={allMapData}
            side="back"
            colors={['#A5B4FC', '#6366F1']}
            scale={0.35}
            border="#E5E7EB"
          />
        </View>
      </View>

      {/* Description */}
      <View className="px-4 mt-5">
        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Description
        </Text>
        <Text className="mt-1 text-sm leading-5 text-gray-700">
          {exercise.description}
        </Text>
      </View>

      {/* Action Buttons (stubs) */}
      <View className="px-4 mt-8 gap-3">
        <TouchableOpacity className="rounded-lg bg-indigo-500 py-3">
          <Text className="text-center font-semibold text-white">Start Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity className="rounded-lg border border-indigo-500 py-3">
          <Text className="text-center font-semibold text-indigo-500">Add to Workout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
