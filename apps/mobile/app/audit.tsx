import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores';
import { apiRequest } from '../src/api/client';
import type { AuditEvent } from '@shopcount/types';
import { Card } from '../src/components/ui';

export default function AuditHistoryScreen() {
  const { accessToken } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['audit-events'],
    queryFn: () =>
      apiRequest<{ items: AuditEvent[]; total: number }>('/audit-events?limit=50', {
        token: accessToken,
      }),
    enabled: !!accessToken,
  });

  return (
    <FlatList
      className="flex-1 bg-background"
      data={data?.items ?? []}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-4"
      ListEmptyComponent={
        <Text className="text-muted text-center py-8">No audit events recorded</Text>
      }
      renderItem={({ item }) => (
        <Card className="mb-3">
          <View className="flex-row justify-between items-start">
            <Text className="font-semibold text-stone-900 capitalize">
              {item.action.replace(/_/g, ' ')}
            </Text>
            {item.offline && (
              <Text className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">Offline</Text>
            )}
          </View>
          <Text className="text-sm text-muted mt-1">
            {item.entityType} · {item.entityId.slice(0, 8)}...
          </Text>
          <Text className="text-xs text-muted mt-2">
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </Card>
      )}
    />
  );
}
