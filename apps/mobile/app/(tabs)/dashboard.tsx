import { useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, useSyncStore } from '../../src/stores';
import { apiRequest } from '../../src/api/client';
import type { DashboardStats, CountSessionWithProgress } from '@shopcount/types';
import { StatCard, Card, StatusChip } from '../../src/components/ui';
import { Button } from '../../src/components/Button';
import { processSyncQueue } from '../../src/lib/sync';
import { formatSyncStatus } from '../../src/lib/utils';

export default function DashboardScreen() {
  const { accessToken, user } = useAuthStore();
  const { isOnline, pendingCount, isSyncing, lastSyncAt } = useSyncStore();

  const { data: stats, refetch: refetchStats, isRefetching } = useQuery({
    queryKey: ['dashboard', user?.storeId],
    queryFn: () =>
      apiRequest<DashboardStats>(`/dashboard?storeId=${user!.storeId}`, { token: accessToken }),
    enabled: !!accessToken && !!user?.storeId,
  });

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions', user?.storeId],
    queryFn: () =>
      apiRequest<CountSessionWithProgress[]>(`/count-sessions?storeId=${user!.storeId}`, {
        token: accessToken,
      }),
    enabled: !!accessToken && !!user?.storeId,
  });

  useFocusEffect(
    useCallback(() => {
      processSyncQueue();
      refetchStats();
      refetchSessions();
    }, [refetchStats, refetchSessions]),
  );

  const activeSessions = sessions?.filter((s) =>
    ['draft', 'in_progress', 'review'].includes(s.status),
  );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 pb-8"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetchStats(); refetchSessions(); processSyncQueue(); }} />}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-xl font-bold text-stone-900">Hello, {user?.name?.split(' ')[0]}</Text>
          <Text className="text-sm text-muted capitalize">{user?.role} · Desi Mart</Text>
        </View>
        <StatusChip
          label={isOnline ? (isSyncing ? 'Syncing...' : formatSyncStatus(pendingCount > 0 ? 'pending' : 'synced').label) : 'Offline'}
          color={isOnline ? (pendingCount > 0 ? '#D97706' : '#16A34A') : '#78716C'}
          bgColor={isOnline ? (pendingCount > 0 ? '#FEF3C7' : '#DCFCE7') : '#F5F5F4'}
        />
      </View>

      <View className="flex-row gap-3 mb-6">
        <StatCard label="Active Counts" value={stats?.activeSessions ?? 0} color="#2563EB" />
        <StatCard label="Pending Review" value={stats?.pendingReview ?? 0} color="#D97706" />
      </View>

      <View className="flex-row gap-3 mb-6">
        <StatCard label="Restricted Issues" value={stats?.restrictedVariances ?? 0} color="#7C3AED" />
        <StatCard label="Low Stock" value={stats?.lowStockItems ?? 0} color="#DC2626" />
      </View>

      {pendingCount > 0 && (
        <Card className="mb-4 border-warning bg-warning/10">
          <Text className="font-semibold text-stone-800">{pendingCount} items pending sync</Text>
          <Text className="text-sm text-muted mt-1">Counts saved locally will sync when online</Text>
          <Button title="Sync Now" onPress={processSyncQueue} loading={isSyncing} className="mt-3" size="sm" />
        </Card>
      )}

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-stone-900">Active Sessions</Text>
        <Button title="+ New" onPress={() => router.push('/count/create')} size="sm" variant="secondary" />
      </View>

      {activeSessions?.length === 0 && (
        <Card>
          <Text className="text-muted text-center py-4">No active count sessions</Text>
        </Card>
      )}

      {activeSessions?.map((session) => (
        <Card key={session.id} onPress={() => router.push(`/count/${session.id}`)} className="mb-3">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-semibold text-base text-stone-900">{session.sessionName}</Text>
              <Text className="text-sm text-muted capitalize mt-1">
                {session.countType} · {session.status.replace(/_/g, ' ')}
              </Text>
            </View>
            <StatusChip
              label={`${session.completionPercent}%`}
              color="#2563EB"
              bgColor="#DBEAFE"
            />
          </View>
          <View className="mt-3 bg-stone-100 rounded-full h-2">
            <View
              className="bg-primary rounded-full h-2"
              style={{ width: `${session.completionPercent}%` }}
            />
          </View>
        </Card>
      ))}

      {(user?.role === 'manager' || user?.role === 'owner') && (
        <View className="mt-4 gap-3">
          <Button
            title="Review Variances"
            variant="secondary"
            onPress={() => {
              const reviewSession = sessions?.find((s) => s.status === 'review');
              if (reviewSession) {
                router.push(`/count/review?sessionId=${reviewSession.id}`);
              } else {
                router.push('/count/review');
              }
            }}
          />
          <Button
            title="Restricted Items Review"
            variant="secondary"
            onPress={() => router.push('/count/restricted')}
          />
        </View>
      )}

      {lastSyncAt && (
        <Text className="text-xs text-muted text-center mt-6">
          Last synced: {new Date(lastSyncAt).toLocaleString()}
        </Text>
      )}
    </ScrollView>
  );
}
