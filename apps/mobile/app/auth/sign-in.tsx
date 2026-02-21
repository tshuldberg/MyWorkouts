import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth-store';
import { SubscriptionPlan } from '@myworkouts/shared';

export default function SignInScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email!,
        display_name: data.user.user_metadata?.display_name ?? null,
        avatar_url: null,
        subscription_tier: SubscriptionPlan.Free,
        coach_id: null,
        created_at: data.user.created_at,
      });
      router.replace('/');
    }
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold text-center text-gray-900 mb-8">
        Welcome Back
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
      />

      <TouchableOpacity
        onPress={handleSignIn}
        disabled={loading}
        className="bg-blue-600 rounded-lg py-3 items-center mb-4"
      >
        <Text className="text-white font-semibold text-base">
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
        <Text className="text-blue-600 text-center text-sm">Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/sign-up')} className="mt-4">
        <Text className="text-gray-500 text-center text-sm">
          Don't have an account? <Text className="text-blue-600">Create one</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
