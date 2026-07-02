import { View, Text, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore, useCountStore } from '../../src/stores';
import { apiRequest } from '../../src/api/client';
import type { CountSessionWithProgress, CountLineWithProduct } from '@shopcount/types';
import { Card, StatusChip } from '../../src/components/ui';
import { Button } from '../../src/components/Button';
import { formatSessionStatus, formatSyncStatus } from '../../src/lib/utils';

export default function CountSessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken, user } = useAuthStore();
  const setActiveSession = useCountStore((s) => s.setActiveSession);

  const { data: session, refetch } = useQuery({
    queryKey: ['session', id],
    queryFn: () =>
      apiRequest<CountSessionWithProgress>(`/count-sessions/${id}`, { token: accessToken }),
    enabled: !!accessToken && !!id,
  });

  const { data: lines = [] } = useQuery({
    queryKey: ['session-lines', id],
    queryFn: () =>
      apiRequest<CountLineWithProduct[]>(`/count-sessions/${id}/lines`, { token: accessToken }),
    enabled: !!accessToken && !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/count-sessions/${id}`, {
        method: 'PATCH',
        token: accessToken,
        body: { status: 'review' },
      }),
    onSuccess: () => {
      Alert.alert('Submitted', 'Count session submitted for manager review');
      refetch();
    },
  });

  const startCounting = () => {
    setActiveSession(id!);
    router.push(`/count/scan?sessionId=${id}`);
  };

  if (!session) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted">Loading session...</Text>
      </View>
    );
  }

  const sync = formatSyncStatus(session.syncStatus);
  const canEdit = ['draft', 'in_progress'].includes(session.status);
  const isManager = user?.role === 'manager' || user?.role === 'owner';

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 pb-32">
        <Card className="mb-4">
          <Text className="text-xl font-bold text-stone-900">{session.sessionName}</Text>
          <View className="flex-row gap-2 mt-2">
            <StatusChip label={formatSessionStatus(session.status)} color="#2563EB" bgColor="#DBEAFE" />
            <StatusChip label={sync.label} color={sync.color} bgColor="#F5F5F4" />
          </View>
          <Text className="text-sm text-muted capitalize mt-2">{session.countType} count</Text>
          {session.notes && <Text className="text-sm text-stone-600 mt-2">{session.notes}</Text>}

          <View className="mt-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-muted">Progress</Text>
              <Text className="text-sm font-medium">{session.completionPercent}%</Text>
            </View>
            <View className="bg-stone-200 rounded-full h-3">
              <View
                className="bg-primary rounded-full h-3"
                style={{ width: `${session.completionPercent}%` }}
              />
            </View>
            <Text className="text-xs text-muted mt-1">
              {session.countedLines} of {session.totalLines} items counted · {session.varianceCount} variances
            </Text>
          </View>
        </Card>

        <Text className="text-lg font-semibold text-stone-900 mb-3">Recent Counts</Text>
        {lines.slice(0, 10).map((line) => (
          <Card key={line.id} className="mb-2">
            <View className="flex-row justify-between">
              <Text className="font-medium text-stone-800 flex-1">{line.product?.name ?? 'Unknown'}</Text>
              <Text
                className="font-bold"
                style={{
                  color:
                    line.varianceQty === 0
                      ? '#16A34A'
                      : (line.varianceQty ?? 0) < 0
                        ? '#DC2626'
                        : '#D97706',
                }}
              >
                {line.countedQty ?? '—'} / {line.expectedQty}
              </Text>
            </View>
          </Card>
        ))}
        {lines.length === 0 && (
          <Text className="text-muted text-center py-4">No items counted yet</Text>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 gap-2">
        {canEdit && (
          <>
            <Button title="Scan & Count" onPress={startCounting} size="lg" />
            <Button
              title="Manual Entry"
              variant="secondary"
              onPress={() => router.push(`/count/manual?sessionId=${id}`)}
            />
            <Button
              title="Submit for Review"
              variant="secondary"
              onPress={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
            />
          </>
        )}
        {isManager && session.status === 'review' && (
          <>
            <Button
              title="Review Variances"
              onPress={() => router.push(`/count/review?sessionId=${id}`)}
            />
            <Button
              title="Restricted Items"
              variant="secondary"
              onPress={() => router.push(`/count/restricted?sessionId=${id}`)}
            />
          </>
        )}
      </View>
    </View>
  );
}
