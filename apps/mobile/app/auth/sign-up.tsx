import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert(
      'Check Your Email',
      'We sent a confirmation link. Please verify your email to continue.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold text-center text-gray-900 mb-8">
        Create Account
      </Text>

      <TextInput
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
      />

      <TextInput
        placeholder="Password (min 8 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
      />

      <TouchableOpacity
        onPress={handleSignUp}
        disabled={loading}
        className="bg-blue-600 rounded-lg py-3 items-center mb-4"
      >
        <Text className="text-white font-semibold text-base">
          {loading ? 'Creating account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-gray-500 text-center text-sm">
          Already have an account? <Text className="text-blue-600">Sign in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
