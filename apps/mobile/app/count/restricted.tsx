import { View, Text, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/stores';
import { apiRequest } from '../../src/api/client';
import type { CountLineWithProduct } from '@shopcount/types';
import { Card, StatusChip, RestrictedBadge } from '../../src/components/ui';
import { getVarianceColor } from '../../src/lib/utils';

export default function RestrictedReviewScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { accessToken, user } = useAuthStore();

  const { data: lines = [] } = useQuery({
    queryKey: ['restricted-lines', sessionId, user?.storeId],
    queryFn: async () => {
      if (sessionId) {
        const all = await apiRequest<CountLineWithProduct[]>(
          `/count-sessions/${sessionId}/lines?filter=restricted`,
          { token: accessToken },
        );
        return all.filter((l) => l.varianceQty !== 0 || l.requiresApproval);
      }
      const sessions = await apiRequest<Array<{ id: string }>>(
        `/count-sessions?storeId=${user!.storeId}`,
        { token: accessToken },
      );
      const allLines: CountLineWithProduct[] = [];
      for (const s of sessions.slice(0, 5)) {
        const sessionLines = await apiRequest<CountLineWithProduct[]>(
          `/count-sessions/${s.id}/lines?filter=restricted`,
          { token: accessToken },
        );
        allLines.push(...sessionLines.filter((l) => l.varianceQty !== 0 || l.requiresApproval));
      }
      return allLines;
    },
    enabled: !!accessToken,
  });

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 bg-restricted/10 border-b border-restricted/20">
        <Text className="font-semibold text-restricted">Restricted Items Review</Text>
        <Text className="text-sm text-muted mt-1">
          Alcohol and tobacco discrepancies require manager approval before posting
        </Text>
      </View>

      <FlatList
        data={lines}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        ListEmptyComponent={
          <Text className="text-muted text-center py-8">No restricted item discrepancies</Text>
        }
        renderItem={({ item }) => (
          <Card className="mb-3 border-restricted/30">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="font-semibold text-stone-900 flex-1">{item.product?.name}</Text>
              <RestrictedBadge type={item.product?.restrictedType ?? 'none'} />
            </View>

            <View className="flex-row gap-2 mb-2">
              {item.requiresApproval && !item.approved && (
                <StatusChip label="Pending Approval" color="#DC2626" bgColor="#FEE2E2" />
              )}
              {item.approved && (
                <StatusChip label="Approved" color="#16A34A" bgColor="#DCFCE7" />
              )}
            </View>

            <View className="flex-row justify-between bg-stone-50 rounded-lg p-3">
              <Text>Expected: <Text className="font-bold">{item.expectedQty}</Text></Text>
              <Text>Counted: <Text className="font-bold">{item.countedQty ?? '—'}</Text></Text>
              <Text style={{ color: getVarianceColor(item.varianceQty) }}>
                Var: <Text className="font-bold">{item.varianceQty ?? '—'}</Text>
              </Text>
            </View>

            {item.reasonCode && (
              <Text className="text-sm text-muted mt-2 capitalize">
                {item.reasonCode.replace(/_/g, ' ')}
              </Text>
            )}
          </Card>
        )}
      />
    </View>
  );
}
