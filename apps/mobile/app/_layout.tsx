import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import '../global.css';
import { useAuthStore } from '../src/stores';
import { loadStoredAuth } from '../src/lib/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    loadStoredAuth().finally(() => setLoading(false));
  }, [setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" options={{ headerShown: true, title: 'Product' }} />
        <Stack.Screen name="count/create" options={{ headerShown: true, title: 'New Count' }} />
        <Stack.Screen name="count/[id]" options={{ headerShown: true, title: 'Count Session' }} />
        <Stack.Screen name="count/scan" options={{ headerShown: true, title: 'Scan Count' }} />
        <Stack.Screen name="count/manual" options={{ headerShown: true, title: 'Manual Entry' }} />
        <Stack.Screen name="count/review" options={{ headerShown: true, title: 'Variance Review' }} />
        <Stack.Screen name="count/restricted" options={{ headerShown: true, title: 'Restricted Items' }} />
        <Stack.Screen name="audit" options={{ headerShown: true, title: 'Audit History' }} />
      </Stack>
    </QueryClientProvider>
  );
}
