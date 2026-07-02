import { View, Text, FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/stores';
import { apiRequest } from '../../src/api/client';
import type { CountSessionWithProgress } from '@shopcount/types';
import { Card, StatusChip, EmptyState } from '../../src/components/ui';
import { Button } from '../../src/components/Button';
import { formatSessionStatus, formatSyncStatus } from '../../src/lib/utils';

export default function CountsScreen() {
  const { accessToken, user } = useAuthStore();

  const { data: sessions = [], refetch, isRefetching } = useQuery({
    queryKey: ['sessions-list', user?.storeId],
    queryFn: () =>
      apiRequest<CountSessionWithProgress[]>(`/count-sessions?storeId=${user!.storeId}`, {
        token: accessToken,
      }),
    enabled: !!accessToken && !!user?.storeId,
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return { color: '#2563EB', bg: '#DBEAFE' };
      case 'review':
        return { color: '#D97706', bg: '#FEF3C7' };
      case 'approved':
      case 'posted':
        return { color: '#16A34A', bg: '#DCFCE7' };
      default:
        return { color: '#78716C', bg: '#F5F5F4' };
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="p-4">
        <Button title="Start New Count" onPress={() => router.push('/count/create')} size="lg" />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState title="No count sessions" message="Start a new count to begin inventory" />
        }
        renderItem={({ item }) => {
          const sc = statusColor(item.status);
          const sync = formatSyncStatus(item.syncStatus);
          return (
            <Card onPress={() => router.push(`/count/${item.id}`)} className="mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="font-semibold text-base text-stone-900 flex-1 mr-2">
                  {item.sessionName}
                </Text>
                <StatusChip label={formatSessionStatus(item.status)} color={sc.color} bgColor={sc.bg} />
              </View>
              <Text className="text-sm text-muted capitalize">
                {item.countType} count · {item.countedLines}/{item.totalLines} items
              </Text>
              <View className="flex-row items-center justify-between mt-3">
                <StatusChip label={sync.label} color={sync.color} bgColor="#F5F5F4" />
                <Text className="text-sm font-medium text-primary">{item.completionPercent}% done</Text>
              </View>
              {item.status === 'in_progress' && (
                <Button
                  title="Continue Counting"
                  onPress={() => router.push(`/count/scan?sessionId=${item.id}`)}
                  className="mt-3"
                  size="sm"
                />
              )}
            </Card>
          );
        }}
      />
    </View>
  );
}
