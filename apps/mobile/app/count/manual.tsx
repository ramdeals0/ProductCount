import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, FlatList, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { eq } from 'drizzle-orm';
import { generateId } from '../../src/lib/id';
import { useAuthStore, useCountStore } from '../../src/stores';
import { getDb } from '../../src/db';
import { localProducts, localLocations, localCountLines } from '../../src/db/schema';
import { apiRequest } from '../../src/api/client';
import { enqueueSyncItem } from '../../src/lib/sync';
import { calculateVariance } from '../../src/lib/utils';
import { ReasonCode } from '@shopcount/types';
import { Button } from '../../src/components/Button';
import { InputField, CategoryChip, Card, RestrictedBadge } from '../../src/components/ui';

const REASON_CODES = Object.values(ReasonCode);

export default function ManualCountScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { accessToken, user, deviceId } = useAuthStore();
  const { activeLocationId, setActiveLocation } = useCountStore();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<(typeof localProducts.$inferSelect) | null>(
    null,
  );
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const db = getDb();

  const [locationList, setLocationList] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<(typeof localProducts.$inferSelect)>>([]);

  useEffect(() => {
    (async () => {
      const locs = await db.select().from(localLocations);
      setLocationList(locs);
      if (!activeLocationId && locs.length > 0) setActiveLocation(locs[0].id);
      const prods = await db.select().from(localProducts).where(eq(localProducts.active, true));
      setProducts(prods);
    })();
  }, [activeLocationId, setActiveLocation]);

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = async () => {
    if (!selectedProduct || !sessionId || !activeLocationId || !user) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Invalid quantity', 'Enter a valid number');
      return;
    }

    setSaving(true);
    const variance = calculateVariance(selectedProduct.expectedQty, qty, selectedProduct.restrictedType);
    const now = new Date().toISOString();
    const lineId = generateId();

    const existing = await db.select().from(localCountLines).where(eq(localCountLines.sessionId, sessionId));
    const existingLine = existing.find(
      (l) => l.productId === selectedProduct.id && l.locationId === activeLocationId,
    );

    const lineData = {
      sessionId,
      productId: selectedProduct.id,
      locationId: activeLocationId,
      expectedQty: selectedProduct.expectedQty,
      countedQty: qty,
      varianceQty: variance.varianceQty,
      variancePercent: variance.variancePercent,
      note: note || null,
      reasonCode: (reasonCode as typeof ReasonCode[keyof typeof ReasonCode]) ?? null,
      enteredBy: user.id,
      enteredAt: existingLine?.enteredAt ?? now,
      lastEditedBy: user.id,
      lastEditedAt: now,
      requiresApproval: variance.requiresApproval,
      syncStatus: 'pending' as const,
      updatedAt: now,
    };

    if (existingLine) {
      await db.update(localCountLines).set(lineData).where(eq(localCountLines.id, existingLine.id));
    } else {
      await db.insert(localCountLines).values({ id: lineId, ...lineData, approved: false, createdAt: now });
    }

    await enqueueSyncItem({
      operation: 'update',
      entityType: 'count_line',
      entityId: existingLine?.id ?? lineId,
      payload: {
        sessionId,
        productId: selectedProduct.id,
        locationId: activeLocationId,
        countedQty: qty,
        note,
        reasonCode,
      },
      deviceId,
    });

    try {
      if (accessToken) {
        await apiRequest(`/count-sessions/${sessionId}/lines`, {
          method: 'PUT',
          token: accessToken,
          deviceId,
          body: {
            productId: selectedProduct.id,
            locationId: activeLocationId,
            countedQty: qty,
            note,
            reasonCode,
          },
        });
      }
    } catch {
      // offline ok
    }

    setSaving(false);
    Alert.alert('Saved', `Counted ${qty} for ${selectedProduct.name}`, [
      { text: 'Continue', onPress: () => { setSelectedProduct(null); setQuantity(''); setNote(''); } },
      { text: 'Done', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-8">
      <Text className="text-sm font-medium text-stone-700 mb-2">Location</Text>
      <View className="flex-row flex-wrap mb-4">
        {locationList.map((loc) => (
          <CategoryChip
            key={loc.id}
            label={loc.name}
            selected={activeLocationId === loc.id}
            onPress={() => setActiveLocation(loc.id)}
          />
        ))}
      </View>

      {!selectedProduct ? (
        <>
          <InputField
            label="Search Product"
            value={search}
            onChangeText={setSearch}
            placeholder="Name or SKU..."
          />
          <FlatList
            data={filtered.slice(0, 20)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setSelectedProduct(item);
                  setQuantity(String(item.expectedQty));
                }}
                className="bg-white border border-stone-200 rounded-xl p-4 mb-2 min-h-[48px]"
              >
                <Text className="font-medium">{item.name}</Text>
                <Text className="text-sm text-muted">{item.sku} · Expected: {item.expectedQty}</Text>
              </Pressable>
            )}
          />
        </>
      ) : (
        <Card>
          <Text className="text-lg font-bold">{selectedProduct.name}</Text>
          <Text className="text-muted">{selectedProduct.sku}</Text>
          <RestrictedBadge type={selectedProduct.restrictedType} />
          <Text className="text-sm mt-2">Expected: {selectedProduct.expectedQty}</Text>

          <InputField
            label="Counted Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="0"
          />

          <InputField label="Note (optional)" value={note} onChangeText={setNote} placeholder="Damaged, open pack..." />

          {selectedProduct.restrictedCategory && (
            <>
              <Text className="text-sm font-medium text-stone-700 mb-2">Reason Code</Text>
              <View className="flex-row flex-wrap mb-4">
                {REASON_CODES.map((code) => (
                  <CategoryChip
                    key={code}
                    label={code.replace(/_/g, ' ')}
                    selected={reasonCode === code}
                    onPress={() => setReasonCode(code)}
                  />
                ))}
              </View>
            </>
          )}

          <View className="flex-row gap-2 mt-2">
            {[0, 1, 5, 10].map((n) => (
              <Pressable
                key={n}
                onPress={() => setQuantity(String(n))}
                className="flex-1 bg-stone-100 rounded-xl py-3 items-center min-h-[48px] justify-center"
              >
                <Text className="font-bold">{n}</Text>
              </Pressable>
            ))}
          </View>

          <Button title="Save Count" onPress={handleSave} loading={saving} size="lg" className="mt-4" />
          <Button
            title="Choose Different Product"
            variant="ghost"
            onPress={() => setSelectedProduct(null)}
            className="mt-2"
          />
        </Card>
      )}
    </ScrollView>
  );
}
