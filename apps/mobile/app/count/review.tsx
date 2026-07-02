import { useState } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { VarianceFilter } from '@shopcount/types';
import { useAuthStore } from '../../src/stores';
import { apiRequest } from '../../src/api/client';
import type { CountLineWithProduct, CountSessionWithProgress } from '@shopcount/types';
import { Card, CategoryChip, StatusChip, RestrictedBadge } from '../../src/components/ui';
import { Button } from '../../src/components/Button';
import { getVarianceColor } from '../../src/lib/utils';

const FILTERS = Object.values(VarianceFilter);

export default function VarianceReviewScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { accessToken, user } = useAuthStore();
  const [filter, setFilter] = useState<string>(VarianceFilter.ALL);

  const { data: sessions = [] } = useQuery({
    queryKey: ['review-sessions', user?.storeId],
    queryFn: () =>
      apiRequest<CountSessionWithProgress[]>(
        `/count-sessions?storeId=${user!.storeId}&status=review`,
        { token: accessToken },
      ),
    enabled: !!accessToken && !!user?.storeId && !sessionId,
  });

  const activeSessionId = sessionId ?? sessions[0]?.id;

  const { data: lines = [], refetch } = useQuery({
    queryKey: ['review-lines', activeSessionId, filter],
    queryFn: () =>
      apiRequest<CountLineWithProduct[]>(
        `/count-sessions/${activeSessionId}/lines?filter=${filter}`,
        { token: accessToken },
      ),
    enabled: !!accessToken && !!activeSessionId,
  });

  const approveLineMutation = useMutation({
    mutationFn: (lineId: string) =>
      apiRequest(`/count-sessions/${activeSessionId}/lines/${lineId}/approve`, {
        method: 'POST',
        token: accessToken,
      }),
    onSuccess: () => refetch(),
  });

  const approveSessionMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/count-sessions/${activeSessionId}/approve`, {
        method: 'POST',
        token: accessToken,
      }),
    onSuccess: () => Alert.alert('Approved', 'Session approved successfully'),
  });

  if (!activeSessionId) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-muted text-center">No sessions pending review</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 pb-0">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <CategoryChip
              label={item.replace(/_/g, ' ')}
              selected={filter === item}
              onPress={() => setFilter(item)}
            />
          )}
        />
      </View>

      <FlatList
        data={lines}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-32"
        renderItem={({ item }) => {
          const variance = item.varianceQty ?? 0;
          const needsAttention =
            item.requiresApproval ||
            (item.countedQty === 0 && item.expectedQty > 0) ||
            Math.abs(variance) > 5;

          return (
            <Card className={`mb-3 ${needsAttention ? 'border-danger' : ''}`}>
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                  <Text className="font-semibold text-stone-900">{item.product?.name ?? 'Unknown'}</Text>
                  <Text className="text-sm text-muted">{item.product?.sku}</Text>
                  <RestrictedBadge type={item.product?.restrictedType ?? 'none'} />
                </View>
                {item.requiresApproval && (
                  <StatusChip label="Needs Approval" color="#DC2626" bgColor="#FEE2E2" />
                )}
              </View>

              <View className="flex-row justify-between mt-3 bg-stone-50 rounded-lg p-3">
                <View className="items-center">
                  <Text className="text-xs text-muted">Expected</Text>
                  <Text className="font-bold text-lg">{item.expectedQty}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xs text-muted">Counted</Text>
                  <Text className="font-bold text-lg">{item.countedQty ?? '—'}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xs text-muted">Variance</Text>
                  <Text className="font-bold text-lg" style={{ color: getVarianceColor(variance) }}>
                    {item.varianceQty ?? '—'}
                  </Text>
                </View>
              </View>

              {item.reasonCode && (
                <Text className="text-sm text-muted mt-2 capitalize">
                  Reason: {item.reasonCode.replace(/_/g, ' ')}
                </Text>
              )}

              {item.requiresApproval && !item.approved && (
                <Button
                  title="Approve Line"
                  size="sm"
                  className="mt-3"
                  onPress={() => approveLineMutation.mutate(item.id)}
                  loading={approveLineMutation.isPending}
                />
              )}
            </Card>
          );
        }}
      />

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4">
        <Button
          title="Approve Entire Session"
          onPress={() => approveSessionMutation.mutate()}
          loading={approveSessionMutation.isPending}
          size="lg"
        />
      </View>
    </View>
  );
}
