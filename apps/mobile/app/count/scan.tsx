import { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, FlatList, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { generateId, safeParseJsonArray } from '../../src/lib/id';
import { eq } from 'drizzle-orm';
import { useAuthStore, useCountStore } from '../../src/stores';
import { getDb } from '../../src/db';
import { localProducts, localLocations, localCountLines } from '../../src/db/schema';
import { apiRequest } from '../../src/api/client';
import { enqueueSyncItem, cacheProductsFromServer } from '../../src/lib/sync';
import { calculateVariance } from '../../src/lib/utils';
import { Button } from '../../src/components/Button';
import { Card, RestrictedBadge, CategoryChip } from '../../src/components/ui';

export default function ScanCountScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { accessToken, user, deviceId } = useAuthStore();
  const { activeLocationId, setActiveLocation, scanIncrementMode, toggleScanIncrement } =
    useCountStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [matches, setMatches] = useState<Array<(typeof localProducts.$inferSelect)>>([]);
  const [showChooser, setShowChooser] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<(typeof localProducts.$inferSelect) | null>(
    null,
  );

  const [locationList, setLocationList] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    (async () => {
      const db = getDb();
      const locs = await db.select().from(localLocations);
      setLocationList(locs);
      if (!activeLocationId && locs.length > 0) {
        setActiveLocation(locs[0].id);
      }

      if (locs.length === 0 && accessToken && user?.storeId) {
        try {
          await cacheProductsFromServer(accessToken, user.storeId);
          const refreshed = await db.select().from(localLocations);
          setLocationList(refreshed);
          if (!activeLocationId && refreshed.length > 0) {
            setActiveLocation(refreshed[0].id);
          }
        } catch {
          // Settings screen has manual refresh
        }
      }
    })();
  }, [activeLocationId, setActiveLocation, accessToken, user?.storeId]);

  const lookupLocalBarcode = useCallback(async (barcode: string) => {
    const db = getDb();
    const all = await db.select().from(localProducts).where(eq(localProducts.active, true));
    return all.filter((p) => {
      if (p.barcodePrimary === barcode) return true;
      const alternates = safeParseJsonArray(p.barcodeAlternates);
      return alternates.includes(barcode);
    });
  }, []);

  const saveCount = async (product: typeof localProducts.$inferSelect, qty: number) => {
    if (!sessionId) {
      Alert.alert('Missing session', 'Open a count session before scanning.');
      return;
    }
    if (!activeLocationId) {
      Alert.alert('Select location', 'Choose a location before counting items.');
      return;
    }
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in again.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const lineId = generateId();

      const db = getDb();
      const existing = await db
        .select()
        .from(localCountLines)
        .where(eq(localCountLines.sessionId, sessionId));

      const existingLine = existing.find(
        (l) => l.productId === product.id && l.locationId === activeLocationId,
      );

      let finalQty = qty;
      if (existingLine && scanIncrementMode && existingLine.countedQty !== null) {
        finalQty = existingLine.countedQty + qty;
      }

      const finalVariance = calculateVariance(product.expectedQty, finalQty, product.restrictedType);
      const lineData = {
        sessionId,
        productId: product.id,
        locationId: activeLocationId,
        expectedQty: product.expectedQty,
        countedQty: finalQty,
        varianceQty: finalVariance.varianceQty,
        variancePercent: finalVariance.variancePercent,
        enteredBy: user.id,
        enteredAt: existingLine?.enteredAt ?? now,
        lastEditedBy: user.id,
        lastEditedAt: now,
        requiresApproval: finalVariance.requiresApproval,
        syncStatus: 'pending' as const,
        updatedAt: now,
      };

      if (existingLine) {
        await db
          .update(localCountLines)
          .set(lineData)
          .where(eq(localCountLines.id, existingLine.id));
      } else {
        await db.insert(localCountLines).values({
          id: lineId,
          ...lineData,
          approved: false,
          createdAt: now,
        });
      }

      await enqueueSyncItem({
        operation: 'update',
        entityType: 'count_line',
        entityId: existingLine?.id ?? lineId,
        payload: {
          sessionId,
          productId: product.id,
          locationId: activeLocationId,
          countedQty: finalQty,
          increment: scanIncrementMode,
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
              productId: product.id,
              locationId: activeLocationId,
              countedQty: finalQty,
              increment: scanIncrementMode,
            },
          });
        }
      } catch {
        // Saved locally, will sync later
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedProduct(null);
      setShowChooser(false);
      setScanned(false);
      setLastScan(`${product.name}: ${finalQty}`);
    } catch (err) {
      setScanned(false);
      Alert.alert(
        'Count failed',
        err instanceof Error ? err.message : 'Could not save this count. Try again or use manual entry.',
      );
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const found = await lookupLocalBarcode(data);

      if (found.length === 0) {
        Alert.alert('Unknown Barcode', data, [
          { text: 'Scan Again', onPress: () => setScanned(false) },
          {
            text: 'Record Unresolved',
            onPress: async () => {
              if (accessToken && sessionId && activeLocationId) {
                try {
                  await apiRequest(`/count-sessions/${sessionId}/unresolved-scans`, {
                    method: 'POST',
                    token: accessToken,
                    body: { barcode: data, locationId: activeLocationId },
                  });
                } catch {
                  // offline
                }
              }
              setScanned(false);
            },
          },
        ]);
        return;
      }

      if (found.length === 1) {
        setSelectedProduct(found[0]);
        if (scanIncrementMode) {
          await saveCount(found[0], 1);
        } else {
          setScanned(false);
        }
      } else {
        setMatches(found);
        setShowChooser(true);
        setScanned(false);
      }
    } catch (err) {
      setScanned(false);
      Alert.alert(
        'Scan error',
        err instanceof Error ? err.message : 'Something went wrong while processing the barcode.',
      );
    }
  };

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-lg font-semibold mb-4 text-center">Camera permission required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {!showChooser && !selectedProduct && (
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}

      <View className="absolute top-0 left-0 right-0 p-4 bg-black/60">
        <Text className="text-white font-semibold text-center">Scan barcode to count</Text>
        {lastScan && <Text className="text-green-400 text-center mt-1">{lastScan}</Text>}
      </View>

      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4">
        <Text className="text-sm font-medium text-stone-700 mb-2">Location</Text>
        {locationList.length === 0 && (
          <Text className="text-sm text-danger mb-3">
            No locations loaded. Sign out and sign in again, or refresh product cache in Settings.
          </Text>
        )}
        <View className="flex-row flex-wrap mb-3">
          {locationList.map((loc) => (
            <CategoryChip
              key={loc.id}
              label={loc.name}
              selected={activeLocationId === loc.id}
              onPress={() => setActiveLocation(loc.id)}
            />
          ))}
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-stone-700">Increment mode (+1 per scan)</Text>
          <Pressable
            onPress={toggleScanIncrement}
            className={`w-14 h-8 rounded-full justify-center ${scanIncrementMode ? 'bg-primary' : 'bg-stone-300'}`}
          >
            <View
              className={`w-6 h-6 rounded-full bg-white ${scanIncrementMode ? 'self-end mr-1' : 'self-start ml-1'}`}
            />
          </Pressable>
        </View>

        {selectedProduct && !scanIncrementMode && (
          <Card className="mb-3">
            <Text className="font-semibold">{selectedProduct.name}</Text>
            <Text className="text-muted text-sm">Expected: {selectedProduct.expectedQty}</Text>
            <RestrictedBadge type={selectedProduct.restrictedType} />
            <View className="flex-row gap-2 mt-3">
              {[0, 1, 5, 10].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => saveCount(selectedProduct, n)}
                  className="flex-1 bg-stone-100 rounded-xl py-3 items-center min-h-[48px] justify-center"
                >
                  <Text className="font-bold text-lg">{n}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        )}

        {showChooser && (
          <FlatList
            data={matches}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 200 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setSelectedProduct(item);
                  setShowChooser(false);
                  if (scanIncrementMode) saveCount(item, 1);
                }}
                className="py-3 border-b border-stone-100"
              >
                <Text className="font-medium">{item.name}</Text>
                <Text className="text-sm text-muted">{item.sku}</Text>
              </Pressable>
            )}
          />
        )}

        <Button
          title="Manual Entry"
          variant="secondary"
          onPress={() => router.push(`/count/manual?sessionId=${sessionId}`)}
        />
      </View>
    </View>
  );
}
