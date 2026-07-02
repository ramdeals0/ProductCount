import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@shopcount/types';
import { useAuthStore } from '../src/stores';
import { login } from '../src/lib/auth';
import { Button } from '../src/components/Button';
import { InputField } from '../src/components/ui';
import { cacheProductsFromServer } from '../src/lib/sync';
import { API_URL } from '../src/api/client';

export default function LoginScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'staff@desimart.com', password: 'password123' },
  });

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.user.storeId) {
        try {
          await cacheProductsFromServer(result.tokens.accessToken, result.user.storeId);
        } catch {
          Alert.alert(
            'Offline catalog',
            'Signed in, but product data could not be downloaded. Use Settings → Refresh Product Cache before counting.',
          );
        }
      }
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes('Cannot reach the server')
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Please try again';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerClassName="flex-grow justify-center p-6">
        <View className="mb-10">
          <Text className="text-3xl font-bold text-stone-900">ShopCount</Text>
          <Text className="text-base text-muted mt-2">Inventory counting for store staff</Text>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <InputField
              label="Email"
              value={value}
              onChangeText={onChange}
              placeholder="you@store.com"
              keyboardType="email-address"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <InputField
              label="Password"
              value={value}
              onChangeText={onChange}
              placeholder="••••••••"
              secureTextEntry
            />
          )}
        />

        <Button title="Sign In" onPress={handleSubmit(onSubmit)} loading={loading} size="lg" />

        <Text className="text-xs text-muted text-center mt-6">
          Demo: staff@desimart.com / password123
        </Text>
        <Text className="text-xs text-muted text-center mt-2" selectable>
          API: {API_URL}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
