import { Redirect } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuthStore } from '../src/stores';

export default function SplashScreen() {
  const { isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <Text className="text-white text-3xl font-bold mb-4">ShopCount</Text>
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white/80 mt-4 text-base">Loading inventory...</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/login" />;
}
