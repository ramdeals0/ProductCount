import { eq, and, desc, sql, or, ilike, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  auditEvents,
  countLines,
  countSessions,
  productBarcodes,
  products,
  users,
  refreshTokens,
  categories,
  locations,
  approvals,
  syncEvents,
  unresolvedScans,
} from '../db/schema.js';
import type { AuditAction, EntityType } from '@shopcount/types';

export async function createAuditEvent(params: {
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  userId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  deviceId?: string;
  offline?: boolean;
}) {
  const [event] = await db
    .insert(auditEvents)
    .values({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      userId: params.userId,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
      deviceId: params.deviceId ?? null,
      offline: params.offline ?? false,
    })
    .returning();
  return event;
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function saveRefreshToken(userId: string, tokenHash: string, deviceId?: string, expiresAt?: Date) {
  const [token] = await db
    .insert(refreshTokens)
    .values({
      userId,
      tokenHash,
      deviceId,
      expiresAt: expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning();
  return token;
}

export async function findProducts(params: {
  storeId: string;
  q?: string;
  categoryId?: string;
  restrictedOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const conditions = [eq(products.storeId, params.storeId), eq(products.active, true)];
  if (params.categoryId) conditions.push(eq(products.categoryId, params.categoryId));
  if (params.restrictedOnly) conditions.push(eq(products.restrictedCategory, true));
  if (params.q) {
    const term = `%${params.q}%`;
    conditions.push(or(ilike(products.name, term), ilike(products.sku, term))!);
  }

  const items = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(and(...conditions));

  return { items, total: count };
}

export async function findProductById(id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return product ?? null;
}

export async function findProductsByBarcode(storeId: string, barcode: string) {
  const barcodeMatches = await db
    .select({ productId: productBarcodes.productId })
    .from(productBarcodes)
    .where(eq(productBarcodes.barcode, barcode));

  const productIds = barcodeMatches.map((b) => b.productId);

  const primaryMatches = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        eq(products.active, true),
        or(eq(products.barcodePrimary, barcode), productIds.length ? inArray(products.id, productIds) : sql`false`)!,
      ),
    );

  return primaryMatches;
}

export async function getProductBarcodes(productId: string) {
  return db.select().from(productBarcodes).where(eq(productBarcodes.productId, productId));
}

export async function findCategories(storeId: string) {
  return db.select().from(categories).where(eq(categories.storeId, storeId)).orderBy(categories.sortOrder);
}

export async function findLocations(storeId: string) {
  return db
    .select()
    .from(locations)
    .where(and(eq(locations.storeId, storeId), eq(locations.active, true)))
    .orderBy(locations.sortOrder);
}

export async function findSessions(storeId: string, status?: string) {
  const conditions = [eq(countSessions.storeId, storeId)];
  if (status) conditions.push(eq(countSessions.status, status as typeof countSessions.status.enumValues[number]));

  return db
    .select()
    .from(countSessions)
    .where(and(...conditions))
    .orderBy(desc(countSessions.updatedAt));
}

export async function findSessionById(id: string) {
  const [session] = await db.select().from(countSessions).where(eq(countSessions.id, id)).limit(1);
  return session ?? null;
}

export async function findCountLines(sessionId: string) {
  return db.select().from(countLines).where(eq(countLines.sessionId, sessionId));
}

export async function findCountLineById(id: string) {
  const [line] = await db.select().from(countLines).where(eq(countLines.id, id)).limit(1);
  return line ?? null;
}

export async function findCountLineByKey(sessionId: string, productId: string, locationId: string) {
  const [line] = await db
    .select()
    .from(countLines)
    .where(
      and(
        eq(countLines.sessionId, sessionId),
        eq(countLines.productId, productId),
        eq(countLines.locationId, locationId),
      ),
    )
    .limit(1);
  return line ?? null;
}

export async function findAuditEvents(params: {
  entityType?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];
  if (params.entityType) conditions.push(eq(auditEvents.entityType, params.entityType as typeof auditEvents.entityType.enumValues[number]));
  if (params.entityId) conditions.push(eq(auditEvents.entityId, params.entityId));
  if (params.userId) conditions.push(eq(auditEvents.userId, params.userId));

  const where = conditions.length ? and(...conditions) : undefined;

  const items = await db
    .select()
    .from(auditEvents)
    .where(where)
    .orderBy(desc(auditEvents.timestamp))
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditEvents)
    .where(where);

  return { items, total: count };
}

export async function createApproval(params: {
  sessionId?: string;
  lineId?: string;
  approvedBy: string;
  notes?: string;
}) {
  const [approval] = await db
    .insert(approvals)
    .values({
      sessionId: params.sessionId,
      lineId: params.lineId,
      approvedBy: params.approvedBy,
      notes: params.notes,
    })
    .returning();
  return approval;
}

export async function recordSyncEvent(params: {
  deviceId: string;
  operation: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  clientTimestamp: Date;
  status?: 'synced' | 'pending' | 'failed';
  errorMessage?: string;
}) {
  const [event] = await db
    .insert(syncEvents)
    .values({
      deviceId: params.deviceId,
      operation: params.operation as typeof syncEvents.operation.enumValues[number],
      entityType: params.entityType,
      entityId: params.entityId,
      payload: params.payload,
      clientTimestamp: params.clientTimestamp,
      status: params.status ?? 'synced',
      errorMessage: params.errorMessage,
    })
    .returning();
  return event;
}

export async function createUnresolvedScan(params: {
  sessionId: string;
  locationId: string;
  barcode: string;
  scannedBy: string;
}) {
  const [scan] = await db.insert(unresolvedScans).values(params).returning();
  return scan;
}

export async function getDashboardStats(storeId: string) {
  const [activeSessions] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(countSessions)
    .where(
      and(
        eq(countSessions.storeId, storeId),
        inArray(countSessions.status, ['draft', 'in_progress', 'review']),
      ),
    );

  const [pendingReview] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(countSessions)
    .where(and(eq(countSessions.storeId, storeId), eq(countSessions.status, 'review')));

  const [restrictedVariances] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(countLines)
    .innerJoin(countSessions, eq(countLines.sessionId, countSessions.id))
    .innerJoin(products, eq(countLines.productId, products.id))
    .where(
      and(
        eq(countSessions.storeId, storeId),
        eq(products.restrictedCategory, true),
        eq(countLines.requiresApproval, true),
        eq(countLines.approved, false),
      ),
    );

  const [lowStock] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(
      and(
        eq(products.storeId, storeId),
        eq(products.active, true),
        sql`${products.expectedQty} <= ${products.reorderLevel}`,
      ),
    );

  const [syncIssues] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(syncEvents)
    .where(eq(syncEvents.status, 'failed'));

  return {
    activeSessions: activeSessions?.count ?? 0,
    pendingReview: pendingReview?.count ?? 0,
    restrictedVariances: restrictedVariances?.count ?? 0,
    lowStockItems: lowStock?.count ?? 0,
    syncIssues: syncIssues?.count ?? 0,
  };
}
