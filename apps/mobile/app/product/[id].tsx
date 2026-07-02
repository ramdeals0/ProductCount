import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { localProducts, localCategories } from '../../src/db/schema';
import { Card, RestrictedBadge } from '../../src/components/ui';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const db = getDb();
      const [p] = await db.select().from(localProducts).where(eq(localProducts.id, id!)).limit(1);
      return p ?? null;
    },
    enabled: !!id,
  });

  const { data: category } = useQuery({
    queryKey: ['category', product?.categoryId],
    queryFn: async () => {
      const db = getDb();
      const [c] = await db
        .select()
        .from(localCategories)
        .where(eq(localCategories.id, product!.categoryId))
        .limit(1);
      return c ?? null;
    },
    enabled: !!product?.categoryId,
  });

  if (!product) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted">Product not found</Text>
      </View>
    );
  }

  const alternates = product.barcodeAlternates ? JSON.parse(product.barcodeAlternates) : [];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4">
      <Card className="mb-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-xl font-bold text-stone-900 flex-1 mr-2">{product.name}</Text>
          <RestrictedBadge type={product.restrictedType} />
        </View>
        {product.brand && <Text className="text-muted">{product.brand}</Text>}
      </Card>

      <Card className="mb-4">
        <DetailRow label="SKU" value={product.sku} />
        <DetailRow label="Category" value={category?.name ?? 'Unknown'} />
        <DetailRow label="Unit Type" value={product.unitType} />
        <DetailRow label="Expected Qty" value={String(product.expectedQty)} />
        <DetailRow label="Reorder Level" value={String(product.reorderLevel)} />
      </Card>

      <Card>
        <Text className="font-semibold text-stone-800 mb-2">Barcodes</Text>
        {product.barcodePrimary && (
          <DetailRow label="Primary" value={product.barcodePrimary} />
        )}
        {alternates.map((bc: string) => (
          <DetailRow key={bc} label="Alternate" value={bc} />
        ))}
        {!product.barcodePrimary && alternates.length === 0 && (
          <Text className="text-muted text-sm">No barcodes on file</Text>
        )}
      </Card>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-stone-100">
      <Text className="text-muted">{label}</Text>
      <Text className="font-medium text-stone-800 capitalize">{value}</Text>
    </View>
  );
}
