import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { PRICING, SubscriptionPlan } from '@myworkouts/shared';

export default function SubscriptionScreen() {
  const router = useRouter();
  const [annual, setAnnual] = useState(true);

  function handleSubscribe() {
    // TODO: Integrate RevenueCat
    Alert.alert(
      'Premium',
      'RevenueCat integration coming soon. This will open the native purchase flow.',
      [{ text: 'OK' }]
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-8">
        <Text className="text-2xl font-bold text-center text-gray-900">
          Upgrade to Premium
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Unlock all features for your fitness journey
        </Text>

        <View className="flex-row items-center justify-center mt-6 gap-3">
          <Text className={`text-sm ${!annual ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </Text>
          <TouchableOpacity
            onPress={() => setAnnual(!annual)}
            className={`w-11 h-6 rounded-full justify-center ${annual ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <View
              className={`w-4 h-4 rounded-full bg-white ${annual ? 'ml-6' : 'ml-1'}`}
            />
          </TouchableOpacity>
          <Text className={`text-sm ${annual ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
            Annual (Save 33%)
          </Text>
        </View>

        {PRICING.map((tier) => (
          <View
            key={tier.plan}
            className={`mt-6 rounded-xl border p-6 ${
              tier.plan === SubscriptionPlan.Premium
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            <Text className="text-lg font-bold text-gray-900">{tier.name}</Text>
            <View className="flex-row items-baseline mt-2">
              <Text className="text-3xl font-bold text-gray-900">
                ${annual ? (tier.annualPrice / 12).toFixed(0) : tier.monthlyPrice}
              </Text>
              <Text className="text-gray-500 ml-1">/month</Text>
            </View>
            {annual && tier.annualPrice > 0 && (
              <Text className="text-sm text-gray-400 mt-1">
                Billed ${tier.annualPrice}/year
              </Text>
            )}

            {tier.features.map((feature) => (
              <View key={feature} className="flex-row items-start gap-2 mt-3">
                <Text className="text-green-500 mt-0.5">&#10003;</Text>
                <Text className="text-sm text-gray-600 flex-1">{feature}</Text>
              </View>
            ))}

            {tier.plan === SubscriptionPlan.Premium && (
              <TouchableOpacity
                onPress={handleSubscribe}
                className="mt-6 bg-blue-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold">Upgrade to Premium</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity onPress={() => router.back()} className="mt-6">
          <Text className="text-gray-500 text-center text-sm">Maybe later</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
