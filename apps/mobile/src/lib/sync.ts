import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import * as Network from 'expo-network';
import { getDb } from '../db';
import { syncQueue, localCountLines, localSessions, localProducts, localCategories, localLocations } from '../db/schema';
import { apiRequest } from '../api/client';
import { useAuthStore, useSyncStore } from '../stores';
import type { SyncBatchInput } from '@shopcount/types';

export async function enqueueSyncItem(params: {
  operation: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  deviceId: string;
}) {
  const db = getDb();
  await db.insert(syncQueue).values({
    id: uuidv4(),
    operation: params.operation,
    entityType: params.entityType,
    entityId: params.entityId,
    payload: JSON.stringify(params.payload),
    clientTimestamp: new Date().toISOString(),
    deviceId: params.deviceId,
    status: 'pending',
  });

  const pending = await db.select().from(syncQueue).where(eq(syncQueue.status, 'pending'));
  useSyncStore.getState().setPendingCount(pending.length);
}

export async function processSyncQueue() {
  const { accessToken, deviceId } = useAuthStore.getState();
  if (!accessToken) return;

  const network = await Network.getNetworkStateAsync();
  if (!network.isConnected) {
    useSyncStore.getState().setOnline(false);
    return;
  }

  useSyncStore.getState().setOnline(true);
  useSyncStore.getState().setSyncing(true);

  const db = getDb();
  const pending = await db.select().from(syncQueue).where(eq(syncQueue.status, 'pending'));

  if (pending.length === 0) {
    useSyncStore.getState().setSyncing(false);
    return;
  }

  const batch: SyncBatchInput = {
    deviceId,
    items: pending.map((item) => ({
      id: item.id,
      operation: item.operation as 'create' | 'update' | 'delete' | 'approve',
      entityType: item.entityType,
      entityId: item.entityId,
      payload: JSON.parse(item.payload),
      clientTimestamp: item.clientTimestamp,
      deviceId: item.deviceId,
      retryCount: item.retryCount,
    })),
  };

  try {
    await apiRequest('/sync/batch', {
      method: 'POST',
      body: batch,
      token: accessToken,
      deviceId,
    });

    for (const item of pending) {
      await db.update(syncQueue).set({ status: 'synced' }).where(eq(syncQueue.id, item.id));
    }

    await db.update(localSessions).set({ syncStatus: 'synced' }).where(eq(localSessions.syncStatus, 'pending'));
    await db.update(localCountLines).set({ syncStatus: 'synced' }).where(eq(localCountLines.syncStatus, 'pending'));

    useSyncStore.getState().setLastSync(new Date().toISOString());
    useSyncStore.getState().setPendingCount(0);
  } catch {
    for (const item of pending) {
      await db
        .update(syncQueue)
        .set({ retryCount: item.retryCount + 1, status: 'failed' })
        .where(eq(syncQueue.id, item.id));
    }
  } finally {
    useSyncStore.getState().setSyncing(false);
  }
}

export async function cacheProductsFromServer(token: string, storeId: string) {
  const db = getDb();

  const [productsRes, categories, locations] = await Promise.all([
    apiRequest<{ items: Array<Record<string, unknown>> }>(
      `/products?storeId=${storeId}&limit=100`,
      { token },
    ),
    apiRequest<Array<Record<string, unknown>>>(`/categories?storeId=${storeId}`, { token }),
    apiRequest<Array<Record<string, unknown>>>(`/locations?storeId=${storeId}`, { token }),
  ]);

  for (const cat of categories) {
    await db
      .insert(localCategories)
      .values({
        id: cat.id as string,
        storeId: cat.storeId as string,
        name: cat.name as string,
        slug: cat.slug as string,
        restrictedCategory: cat.restrictedCategory as boolean,
        sortOrder: cat.sortOrder as number,
      })
      .onConflictDoUpdate({
        target: localCategories.id,
        set: { name: cat.name as string, sortOrder: cat.sortOrder as number },
      });
  }

  for (const loc of locations) {
    await db
      .insert(localLocations)
      .values({
        id: loc.id as string,
        storeId: loc.storeId as string,
        name: loc.name as string,
        code: loc.code as string,
        sortOrder: loc.sortOrder as number,
      })
      .onConflictDoUpdate({
        target: localLocations.id,
        set: { name: loc.name as string },
      });
  }

  for (const p of productsRes.items) {
    await db
      .insert(localProducts)
      .values({
        id: p.id as string,
        storeId: p.storeId as string,
        sku: p.sku as string,
        name: p.name as string,
        categoryId: p.categoryId as string,
        subcategory: (p.subcategory as string) ?? null,
        brand: (p.brand as string) ?? null,
        unitType: p.unitType as string,
        barcodePrimary: (p.barcodePrimary as string) ?? null,
        barcodeAlternates: JSON.stringify(p.barcodeAlternates ?? []),
        restrictedCategory: p.restrictedCategory as boolean,
        restrictedType: p.restrictedType as string,
        expectedQty: p.expectedQty as number,
        reorderLevel: p.reorderLevel as number,
        active: p.active as boolean,
        imageUrl: (p.imageUrl as string) ?? null,
        updatedAt: p.updatedAt as string,
      })
      .onConflictDoUpdate({
        target: localProducts.id,
        set: {
          name: p.name as string,
          expectedQty: p.expectedQty as number,
          updatedAt: p.updatedAt as string,
        },
      });
  }
}
