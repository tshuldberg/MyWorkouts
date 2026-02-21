import { View, Text } from 'react-native';

export default function WorkoutsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-900">Workouts</Text>
      <Text className="mt-2 text-gray-500">Your workout library</Text>
    </View>
  );
}
