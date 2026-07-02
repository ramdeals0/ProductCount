import { View, Text, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore, useSyncStore } from '../../src/stores';
import { Card, Button, StatusChip } from '../../src/components/ui';
import { clearAuth } from '../../src/lib/auth';
import { processSyncQueue, cacheProductsFromServer } from '../../src/lib/sync';
import { useState } from 'react';

export default function SettingsScreen() {
  const { user, accessToken } = useAuthStore();
  const { isOnline, pendingCount, lastSyncAt } = useSyncStore();
  const [syncing, setSyncing] = useState(false);
  const [caching, setCaching] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleSync = async () => {
    setSyncing(true);
    await processSyncQueue();
    setSyncing(false);
  };

  const handleCacheProducts = async () => {
    if (!accessToken || !user?.storeId) return;
    setCaching(true);
    try {
      await cacheProductsFromServer(accessToken, user.storeId);
      Alert.alert('Success', 'Product catalog cached for offline use');
    } catch {
      Alert.alert('Error', 'Failed to cache products');
    } finally {
      setCaching(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4">
      <Card className="mb-4">
        <Text className="font-semibold text-lg text-stone-900">{user?.name}</Text>
        <Text className="text-muted mt-1">{user?.email}</Text>
        <StatusChip
          label={user?.role ?? 'staff'}
          color="#2563EB"
          bgColor="#DBEAFE"
        />
      </Card>

      <Text className="text-sm font-semibold text-muted uppercase mb-2 mt-2">Sync & Offline</Text>
      <Card className="mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-stone-800">Network</Text>
          <Text className={isOnline ? 'text-success font-medium' : 'text-muted'}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-stone-800">Pending sync</Text>
          <Text className="font-medium">{pendingCount} items</Text>
        </View>
        {lastSyncAt && (
          <Text className="text-xs text-muted mb-3">
            Last sync: {new Date(lastSyncAt).toLocaleString()}
          </Text>
        )}
        <Button title="Sync Now" onPress={handleSync} loading={syncing} size="sm" className="mb-2" />
        <Button
          title="Refresh Product Cache"
          variant="secondary"
          onPress={handleCacheProducts}
          loading={caching}
          size="sm"
        />
      </Card>

      {(user?.role === 'manager' || user?.role === 'owner') && (
        <>
          <Text className="text-sm font-semibold text-muted uppercase mb-2">Management</Text>
          <Card className="mb-4 gap-2">
            <Button title="Audit History" variant="secondary" onPress={() => router.push('/audit')} size="sm" />
            <Button title="Variance Review" variant="secondary" onPress={() => router.push('/count/review')} size="sm" />
            <Button title="Restricted Items" variant="secondary" onPress={() => router.push('/count/restricted')} size="sm" />
          </Card>
        </>
      )}

      <Text className="text-sm font-semibold text-muted uppercase mb-2">App</Text>
      <Card className="mb-4">
        <Text className="text-stone-800">ShopCount v1.0.0</Text>
        <Text className="text-xs text-muted mt-1">Inventory counting for Desi Mart</Text>
      </Card>

      <Button title="Sign Out" variant="danger" onPress={handleLogout} />
    </ScrollView>
  );
}
