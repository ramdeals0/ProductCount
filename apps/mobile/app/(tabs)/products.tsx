import { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { eq, like, or } from 'drizzle-orm';
import { useAuthStore } from '../../src/stores';
import { getDb } from '../../src/db';
import { localProducts, localCategories } from '../../src/db/schema';
import { Card, CategoryChip, RestrictedBadge, EmptyState } from '../../src/components/ui';

export default function ProductsScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuthStore();

  const { data: categories = [] } = useQuery({
    queryKey: ['local-categories'],
    queryFn: async () => {
      const db = getDb();
      return db.select().from(localCategories).orderBy(localCategories.sortOrder);
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['local-products', search, selectedCategory],
    queryFn: async () => {
      const db = getDb();
      let query = db.select().from(localProducts).where(eq(localProducts.active, true));

      const all = await query;
      return all.filter((p) => {
        const matchesSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.barcodePrimary?.includes(search);
        const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    },
  });

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  return (
    <View className="flex-1 bg-background">
      <View className="p-4 pb-2">
        <View className="bg-white border border-stone-300 rounded-xl px-4 min-h-[48px] justify-center mb-3">
          <TextInput
            className="text-base text-stone-900"
            placeholder="Search SKU, name, or barcode..."
            placeholderTextColor="#A8A29E"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'All' }, ...categories]}
          keyExtractor={(item) => item.id ?? 'all'}
          renderItem={({ item }) => (
            <CategoryChip
              label={item.name}
              selected={selectedCategory === item.id}
              onPress={() => setSelectedCategory(item.id)}
            />
          )}
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pt-0"
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="No products found"
              message="Try a different search or sync product data from settings"
            />
          )
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/product/${item.id}`)} className="mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-2">
                <Text className="font-semibold text-base text-stone-900">{item.name}</Text>
                <Text className="text-sm text-muted mt-1">
                  {item.sku} · {categoryMap[item.categoryId] ?? 'Unknown'}
                </Text>
                {item.brand && <Text className="text-xs text-muted mt-1">{item.brand}</Text>}
              </View>
              <View className="items-end">
                <RestrictedBadge type={item.restrictedType} />
                <Text className="text-sm font-medium text-stone-700 mt-2">
                  Qty: {item.expectedQty}
                </Text>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
