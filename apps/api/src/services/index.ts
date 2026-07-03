import {
  AuditAction,
  EntityType,
  SessionStatus,
  UserRole,
  type LoginInput,
  type CreateCountSessionInput,
  type UpsertCountLineInput,
  type SyncBatchInput,
  type CreateProductInput,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type CreateLocationInput,
  type UpdateLocationInput,
  type ProductImportRequest,
} from '@shopcount/types';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { countLines, countSessions, products, users, auditEvents, categories, locations } from '../db/schema.js';
import { AppError } from '../lib/errors.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshExpiryDate,
  getExpiresInSeconds,
} from '../lib/jwt.js';
import { comparePassword, hashPassword, hashToken } from '../lib/password.js';
import { calculateVariance } from '../lib/variance.js';
import {
  createAuditEvent,
  findUserByEmail,
  findUserById,
  saveRefreshToken,
  findSessionById,
  findCountLineByKey,
  findCountLineById,
  findProductById,
  findProductsByBarcode,
  getProductBarcodes,
  findProducts,
  findCategories,
  findSessions,
  findCountLines,
  findAuditEvents,
  createApproval,
  recordSyncEvent,
  createUnresolvedScan,
  getDashboardStats,
  findCategoryById,
  findCategoryBySlug,
  findLocationById,
  findProductBySku,
  setProductBarcodes,
  countProductsInCategory,
} from '../repositories/index.js';

function toAuthUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    storeId: user.storeId,
  };
}

export async function login(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user || !user.active) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const authUser = toAuthUser(user);
  const accessToken = signAccessToken(authUser);
  const refreshToken = signRefreshToken(user.id);
  const tokenHash = await hashToken(refreshToken);
  await saveRefreshToken(user.id, tokenHash, input.deviceId, getRefreshExpiryDate());

  await createAuditEvent({
    entityType: EntityType.USER,
    entityId: user.id,
    action: AuditAction.LOGIN,
    userId: user.id,
    deviceId: input.deviceId,
    newValue: { email: user.email },
  });

  return {
    user: authUser,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: getExpiresInSeconds(),
    },
  };
}

export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await findUserById(payload.sub);
  if (!user || !user.active) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'User not found');
  }

  const authUser = toAuthUser(user);
  const accessToken = signAccessToken(authUser);
  const newRefreshToken = signRefreshToken(user.id);
  const tokenHash = await hashToken(newRefreshToken);
  await saveRefreshToken(user.id, tokenHash, undefined, getRefreshExpiryDate());

  return {
    user: authUser,
    tokens: {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: getExpiresInSeconds(),
    },
  };
}

export async function getMe(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  return toAuthUser(user);
}

export async function listProducts(params: Parameters<typeof findProducts>[0]) {
  const result = await findProducts(params);
  const items = await Promise.all(
    result.items.map(async (p) => {
      const barcodes = await getProductBarcodes(p.id);
      return {
        ...serializeProduct(p),
        barcodeAlternates: barcodes.filter((b) => !b.isPrimary).map((b) => b.barcode),
      };
    }),
  );
  return { items, total: result.total, limit: params.limit ?? 50, offset: params.offset ?? 0 };
}

export async function getProduct(id: string) {
  const product = await findProductById(id);
  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  const barcodes = await getProductBarcodes(id);
  return {
    ...serializeProduct(product),
    barcodeAlternates: barcodes.filter((b) => !b.isPrimary).map((b) => b.barcode),
  };
}

export async function lookupBarcode(storeId: string, barcode: string) {
  const matches = await findProductsByBarcode(storeId, barcode);
  return matches.map(serializeProduct);
}

export async function createProduct(
  userId: string,
  input: CreateProductInput,
  deviceId?: string,
) {
  const existing = await findProductBySku(input.storeId, input.sku);
  if (existing) throw new AppError(409, 'SKU_EXISTS', 'Product SKU already exists');

  const category = await findCategoryById(input.categoryId);
  if (!category || category.storeId !== input.storeId) {
    throw new AppError(400, 'INVALID_CATEGORY', 'Category not found for this store');
  }

  const restrictedType = input.restrictedType ?? 'none';
  const restrictedCategory = input.restrictedCategory ?? restrictedType !== 'none';

  const [product] = await db
    .insert(products)
    .values({
      storeId: input.storeId,
      sku: input.sku,
      name: input.name,
      categoryId: input.categoryId,
      subcategory: input.subcategory ?? null,
      brand: input.brand ?? null,
      unitType: input.unitType ?? 'each',
      barcodePrimary: input.barcodePrimary ?? null,
      restrictedCategory,
      restrictedType,
      expectedQty: input.expectedQty ?? 0,
      reorderLevel: input.reorderLevel ?? 0,
      active: input.active ?? true,
      imageUrl: input.imageUrl || null,
    })
    .returning();

  await setProductBarcodes(product.id, input.barcodePrimary, input.barcodeAlternates ?? []);

  await createAuditEvent({
    entityType: EntityType.PRODUCT,
    entityId: product.id,
    action: AuditAction.PRODUCT_UPDATED,
    userId,
    deviceId,
    newValue: { sku: product.sku, name: product.name, action: 'created' },
  });

  return getProduct(product.id);
}

export async function updateProduct(
  id: string,
  userId: string,
  updates: Partial<CreateProductInput>,
  deviceId?: string,
) {
  const existing = await findProductById(id);
  if (!existing) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

  if (updates.sku && updates.sku !== existing.sku) {
    const dup = await findProductBySku(existing.storeId, updates.sku);
    if (dup) throw new AppError(409, 'SKU_EXISTS', 'Product SKU already exists');
  }

  if (updates.categoryId) {
    const category = await findCategoryById(updates.categoryId);
    if (!category || category.storeId !== existing.storeId) {
      throw new AppError(400, 'INVALID_CATEGORY', 'Category not found for this store');
    }
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.sku !== undefined) patch.sku = updates.sku;
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.categoryId !== undefined) patch.categoryId = updates.categoryId;
  if (updates.subcategory !== undefined) patch.subcategory = updates.subcategory;
  if (updates.brand !== undefined) patch.brand = updates.brand;
  if (updates.unitType !== undefined) patch.unitType = updates.unitType;
  if (updates.barcodePrimary !== undefined) patch.barcodePrimary = updates.barcodePrimary;
  if (updates.restrictedType !== undefined) patch.restrictedType = updates.restrictedType;
  if (updates.restrictedCategory !== undefined) patch.restrictedCategory = updates.restrictedCategory;
  if (updates.expectedQty !== undefined) patch.expectedQty = updates.expectedQty;
  if (updates.reorderLevel !== undefined) patch.reorderLevel = updates.reorderLevel;
  if (updates.active !== undefined) patch.active = updates.active;
  if (updates.imageUrl !== undefined) patch.imageUrl = updates.imageUrl || null;

  if (updates.restrictedType !== undefined && updates.restrictedCategory === undefined) {
    patch.restrictedCategory = updates.restrictedType !== 'none';
  }

  const [product] = await db
    .update(products)
    .set(patch as typeof products.$inferInsert)
    .where(eq(products.id, id))
    .returning();

  if (updates.barcodePrimary !== undefined || updates.barcodeAlternates !== undefined) {
    await setProductBarcodes(
      id,
      updates.barcodePrimary ?? product.barcodePrimary,
      updates.barcodeAlternates ?? (await getProductBarcodes(id)).filter((b) => !b.isPrimary).map((b) => b.barcode),
    );
  }

  await createAuditEvent({
    entityType: EntityType.PRODUCT,
    entityId: id,
    action: AuditAction.PRODUCT_UPDATED,
    userId,
    deviceId,
    oldValue: serializeProduct(existing),
    newValue: serializeProduct(product),
  });

  return getProduct(id);
}

export async function deleteProduct(id: string, userId: string, deviceId?: string) {
  return updateProduct(id, userId, { active: false }, deviceId);
}

export async function exportProductsCsv(storeId: string) {
  const allProducts = await db.select().from(products).where(eq(products.storeId, storeId));
  const cats = await findCategories(storeId);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));

  const header = 'sku,name,category,subcategory,brand,unitType,barcodePrimary,restrictedCategory,restrictedType,expectedQty,reorderLevel,active,imageUrl';
  const rows = allProducts.map((p) => {
      return [
        csvEscape(p.sku),
        csvEscape(p.name),
        csvEscape(catMap.get(p.categoryId) ?? ''),
        csvEscape(p.subcategory ?? ''),
        csvEscape(p.brand ?? ''),
        p.unitType,
        csvEscape(p.barcodePrimary ?? ''),
        p.restrictedCategory,
        p.restrictedType,
        p.expectedQty,
        p.reorderLevel,
        p.active,
        csvEscape(p.imageUrl ?? ''),
      ].join(',');
    });

  return [header, ...rows].join('\n');
}

function csvEscape(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function importProducts(
  userId: string,
  input: ProductImportRequest,
  deviceId?: string,
) {
  const result = {
    dryRun: input.dryRun,
    totalRows: input.rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ row: number; sku?: string; message: string }>,
  };

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i];
    const rowNum = i + 1;
    try {
      const category = await findCategoryBySlug(input.storeId, row.categorySlug);
      if (!category) {
        result.errors.push({ row: rowNum, sku: row.sku, message: `Category slug not found: ${row.categorySlug}` });
        result.skipped++;
        continue;
      }

      const existing = await findProductBySku(input.storeId, row.sku);
      const alternates = row.barcodeAlternates
        ? row.barcodeAlternates.split(',').map((b) => b.trim()).filter(Boolean)
        : [];

      const productData: CreateProductInput = {
        storeId: input.storeId,
        sku: row.sku,
        name: row.name,
        categoryId: category.id,
        subcategory: row.subcategory,
        brand: row.brand,
        unitType: (row.unitType as CreateProductInput['unitType']) ?? 'each',
        barcodePrimary: row.barcodePrimary,
        barcodeAlternates: alternates,
        restrictedCategory: row.restrictedCategory ?? false,
        restrictedType: (row.restrictedType as CreateProductInput['restrictedType']) ?? 'none',
        expectedQty: row.expectedQty ?? 0,
        reorderLevel: row.reorderLevel ?? 0,
        active: row.active ?? true,
        imageUrl: row.imageUrl,
      };

      if (input.dryRun) {
        if (existing) result.updated++;
        else result.created++;
        continue;
      }

      if (existing) {
        await updateProduct(existing.id, userId, productData, deviceId);
        result.updated++;
      } else {
        await createProduct(userId, productData, deviceId);
        result.created++;
      }
    } catch (err) {
      result.errors.push({
        row: rowNum,
        sku: row.sku,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      result.skipped++;
    }
  }

  return result;
}

export async function createCategory(userId: string, input: CreateCategoryInput, deviceId?: string) {
  const existing = await findCategoryBySlug(input.storeId, input.slug);
  if (existing) throw new AppError(409, 'SLUG_EXISTS', 'Category slug already exists');

  const [category] = await db
    .insert(categories)
    .values({
      storeId: input.storeId,
      name: input.name,
      slug: input.slug,
      parentId: input.parentId ?? null,
      restrictedCategory: input.restrictedCategory ?? false,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  await createAuditEvent({
    entityType: EntityType.PRODUCT,
    entityId: category.id,
    action: AuditAction.PRODUCT_UPDATED,
    userId,
    deviceId,
    newValue: { type: 'category', action: 'created', name: category.name },
  });

  return serializeCategory(category);
}

export async function updateCategory(
  id: string,
  userId: string,
  updates: UpdateCategoryInput,
  deviceId?: string,
) {
  const existing = await findCategoryById(id);
  if (!existing) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');

  if (updates.slug && updates.slug !== existing.slug) {
    const dup = await findCategoryBySlug(existing.storeId, updates.slug);
    if (dup) throw new AppError(409, 'SLUG_EXISTS', 'Category slug already exists');
  }

  const [category] = await db
    .update(categories)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning();

  await createAuditEvent({
    entityType: EntityType.PRODUCT,
    entityId: id,
    action: AuditAction.PRODUCT_UPDATED,
    userId,
    deviceId,
    oldValue: serializeCategory(existing),
    newValue: serializeCategory(category),
  });

  return serializeCategory(category);
}

export async function deleteCategory(id: string, userId: string, deviceId?: string) {
  const existing = await findCategoryById(id);
  if (!existing) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');

  const count = await countProductsInCategory(id);
  if (count > 0) {
    throw new AppError(400, 'CATEGORY_IN_USE', `Category has ${count} products assigned`);
  }

  await db.delete(categories).where(eq(categories.id, id));

  await createAuditEvent({
    entityType: EntityType.PRODUCT,
    entityId: id,
    action: AuditAction.PRODUCT_UPDATED,
    userId,
    deviceId,
    oldValue: serializeCategory(existing),
    newValue: { action: 'deleted' },
  });

  return { deleted: true };
}

export async function createLocation(userId: string, input: CreateLocationInput, deviceId?: string) {
  const [location] = await db
    .insert(locations)
    .values({
      storeId: input.storeId,
      name: input.name,
      code: input.code,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    })
    .returning();

  await createAuditEvent({
    entityType: EntityType.PRODUCT,
    entityId: location.id,
    action: AuditAction.PRODUCT_UPDATED,
    userId,
    deviceId,
    newValue: { type: 'location', action: 'created', name: location.name },
  });

  return serializeLocation(location);
}

export async function updateLocation(
  id: string,
  userId: string,
  updates: UpdateLocationInput,
  deviceId?: string,
) {
  const existing = await findLocationById(id);
  if (!existing) throw new AppError(404, 'LOCATION_NOT_FOUND', 'Location not found');

  const [location] = await db
    .update(locations)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(locations.id, id))
    .returning();

  await createAuditEvent({
    entityType: EntityType.PRODUCT,
    entityId: id,
    action: AuditAction.PRODUCT_UPDATED,
    userId,
    deviceId,
    oldValue: serializeLocation(existing),
    newValue: serializeLocation(location),
  });

  return serializeLocation(location);
}

export async function deleteLocation(id: string, userId: string, deviceId?: string) {
  return updateLocation(id, userId, { active: false }, deviceId);
}

export async function getCategory(id: string) {
  const category = await findCategoryById(id);
  if (!category) throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  return serializeCategory(category);
}

export async function getLocation(id: string) {
  const location = await findLocationById(id);
  if (!location) throw new AppError(404, 'LOCATION_NOT_FOUND', 'Location not found');
  return serializeLocation(location);
}

function serializeCategory(c: typeof categories.$inferSelect) {
  return {
    id: c.id,
    storeId: c.storeId,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    restrictedCategory: c.restrictedCategory,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function serializeLocation(l: typeof locations.$inferSelect) {
  return {
    id: l.id,
    storeId: l.storeId,
    name: l.name,
    code: l.code,
    description: l.description,
    sortOrder: l.sortOrder,
    active: l.active,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

export async function listCategories(storeId: string) {
  const items = await findCategories(storeId);
  return items.map(serializeCategory);
}

export async function listLocations(storeId: string) {
  const items = await db
    .select()
    .from(locations)
    .where(eq(locations.storeId, storeId))
    .orderBy(locations.sortOrder);
  return items.map(serializeLocation);
}

export async function createSession(userId: string, input: CreateCountSessionInput, deviceId?: string) {
  const [session] = await db
    .insert(countSessions)
    .values({
      storeId: input.storeId,
      sessionName: input.sessionName,
      countType: input.countType,
      status: SessionStatus.DRAFT,
      createdBy: userId,
      assignedTo: input.assignedTo ?? [userId],
      categoryIds: input.categoryIds ?? [],
      locationIds: input.locationIds ?? [],
      notes: input.notes,
    })
    .returning();

  await createAuditEvent({
    entityType: EntityType.COUNT_SESSION,
    entityId: session.id,
    action: AuditAction.SESSION_CREATED,
    userId,
    deviceId,
    newValue: { sessionName: session.sessionName, countType: session.countType },
  });

  return serializeSession(session);
}

export async function updateSession(
  sessionId: string,
  userId: string,
  updates: Partial<{
    sessionName: string;
    status: string;
    assignedTo: string[];
    categoryIds: string[];
    locationIds: string[];
    notes: string;
  }>,
  deviceId?: string,
) {
  const existing = await findSessionById(sessionId);
  if (!existing) throw new AppError(404, 'SESSION_NOT_FOUND', 'Count session not found');

  const patch: Record<string, unknown> = { ...updates, updatedAt: new Date() };
  if (updates.status === SessionStatus.IN_PROGRESS && !existing.startedAt) {
    patch.startedAt = new Date();
  }
  if (updates.status === SessionStatus.REVIEW) {
    patch.submittedAt = new Date();
  }
  if (updates.status === SessionStatus.APPROVED) {
    patch.approvedAt = new Date();
  }

  const [session] = await db
    .update(countSessions)
    .set(patch as typeof countSessions.$inferInsert)
    .where(eq(countSessions.id, sessionId))
    .returning();

  if (updates.status === SessionStatus.REVIEW) {
    await createAuditEvent({
      entityType: EntityType.COUNT_SESSION,
      entityId: sessionId,
      action: AuditAction.RECOUNT_REQUESTED,
      userId,
      deviceId,
      oldValue: { status: existing.status },
      newValue: { status: session.status },
    });
  }

  if (updates.status === SessionStatus.APPROVED || updates.status === SessionStatus.POSTED) {
    await createAuditEvent({
      entityType: EntityType.COUNT_SESSION,
      entityId: sessionId,
      action:
        updates.status === SessionStatus.POSTED
          ? AuditAction.SESSION_POSTED
          : AuditAction.MANAGER_APPROVED,
      userId,
      deviceId,
      newValue: { status: session.status },
    });
  }

  return serializeSession(session);
}

export async function getSessionWithProgress(sessionId: string) {
  const session = await findSessionById(sessionId);
  if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Count session not found');

  const lines = await findCountLines(sessionId);
  const totalLines = lines.length;
  const countedLines = lines.filter((l) => l.countedQty !== null).length;
  const varianceCount = lines.filter((l) => l.varianceQty !== null && l.varianceQty !== 0).length;

  return {
    ...serializeSession(session),
    totalLines,
    countedLines,
    completionPercent: totalLines === 0 ? 0 : Math.round((countedLines / totalLines) * 100),
    varianceCount,
  };
}

export async function listSessions(storeId: string, status?: string) {
  const sessions = await findSessions(storeId, status);
  return Promise.all(sessions.map((s) => getSessionWithProgress(s.id)));
}

export async function upsertCountLine(
  sessionId: string,
  userId: string,
  input: UpsertCountLineInput,
  deviceId?: string,
  offline = false,
) {
  const session = await findSessionById(sessionId);
  if (!session) throw new AppError(404, 'SESSION_NOT_FOUND', 'Count session not found');
  if ([SessionStatus.APPROVED, SessionStatus.POSTED].includes(session.status as typeof SessionStatus.APPROVED)) {
    throw new AppError(400, 'SESSION_LOCKED', 'Session is locked for editing');
  }

  const product = await findProductById(input.productId);
  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

  const existing = await findCountLineByKey(sessionId, input.productId, input.locationId);
  const expectedQty = product.expectedQty;
  let countedQty = input.countedQty;

  if (existing && input.increment && existing.countedQty !== null) {
    countedQty = existing.countedQty + input.countedQty;
  }

  const variance = calculateVariance(expectedQty, countedQty, product.restrictedType);
  const isEdit = !!existing && existing.countedQty !== null;
  const requiresApproval =
    variance.requiresApproval || (product.restrictedCategory && isEdit);

  const lineData = {
    expectedQty,
    countedQty,
    varianceQty: variance.varianceQty,
    variancePercent: variance.variancePercent,
    enteredBy: existing?.enteredBy ?? userId,
    enteredAt: existing?.enteredAt ?? new Date(),
    lastEditedBy: userId,
    lastEditedAt: new Date(),
    note: input.note ?? existing?.note,
    reasonCode: input.reasonCode ?? existing?.reasonCode,
    requiresApproval: requiresApproval || existing?.requiresApproval || false,
    syncStatus: 'pending' as const,
    updatedAt: new Date(),
  };

  let line;
  if (existing) {
    [line] = await db.update(countLines).set(lineData).where(eq(countLines.id, existing.id)).returning();
  } else {
    [line] = await db
      .insert(countLines)
      .values({
        sessionId,
        productId: input.productId,
        locationId: input.locationId,
        ...lineData,
      })
      .returning();
  }

  if (session.status === SessionStatus.DRAFT) {
    await db
      .update(countSessions)
      .set({ status: SessionStatus.IN_PROGRESS, startedAt: new Date(), updatedAt: new Date() })
      .where(eq(countSessions.id, sessionId));
  }

  await createAuditEvent({
    entityType: EntityType.COUNT_LINE,
    entityId: line.id,
    action: isEdit ? AuditAction.LINE_EDITED : AuditAction.LINE_COUNTED,
    userId,
    deviceId,
    offline,
    oldValue: existing ? { countedQty: existing.countedQty } : undefined,
    newValue: { countedQty: line.countedQty, varianceQty: line.varianceQty },
  });

  if (input.reasonCode) {
    await createAuditEvent({
      entityType: EntityType.COUNT_LINE,
      entityId: line.id,
      action: AuditAction.REASON_CODE_ADDED,
      userId,
      deviceId,
      offline,
      newValue: { reasonCode: input.reasonCode },
    });
  }

  return serializeCountLine(line);
}

export async function getSessionLines(sessionId: string, filter?: string) {
  const lines = await findCountLines(sessionId);
  const enriched = await Promise.all(
    lines.map(async (line) => {
      const product = await findProductById(line.productId);
      return {
        ...serializeCountLine(line),
        product: product ? serializeProduct(product) : undefined,
        restrictedCategory: product?.restrictedCategory ?? false,
      };
    }),
  );

  if (!filter || filter === 'all') return enriched;

  return enriched.filter((line) => {
    const variance = line.varianceQty ?? 0;
    const counted = line.countedQty;
    switch (filter) {
      case 'matched':
        return counted !== null && variance === 0;
      case 'shortage':
        return counted !== null && variance < 0;
      case 'overage':
        return counted !== null && variance > 0;
      case 'restricted':
        return line.restrictedCategory;
      case 'uncounted':
        return counted === null;
      case 'needs_approval':
        return line.requiresApproval && !line.approved;
      default:
        return true;
    }
  });
}

export async function approveLine(lineId: string, userId: string, notes?: string, deviceId?: string) {
  const line = await findCountLineById(lineId);
  if (!line) throw new AppError(404, 'LINE_NOT_FOUND', 'Count line not found');

  const [updated] = await db
    .update(countLines)
    .set({ approved: true, approvedBy: userId, approvedAt: new Date(), updatedAt: new Date() })
    .where(eq(countLines.id, lineId))
    .returning();

  await createApproval({ lineId, approvedBy: userId, notes });
  await createAuditEvent({
    entityType: EntityType.COUNT_LINE,
    entityId: lineId,
    action: AuditAction.MANAGER_APPROVED,
    userId,
    deviceId,
    newValue: { approved: true },
  });

  return serializeCountLine(updated);
}

export async function approveSession(sessionId: string, userId: string, notes?: string, deviceId?: string) {
  const session = await updateSession(sessionId, userId, { status: SessionStatus.APPROVED }, deviceId);
  await createApproval({ sessionId, approvedBy: userId, notes });
  return session;
}

export async function recordUnresolvedScan(params: {
  sessionId: string;
  locationId: string;
  barcode: string;
  scannedBy: string;
}) {
  return createUnresolvedScan(params);
}

export async function getAuditHistory(params: Parameters<typeof findAuditEvents>[0]) {
  const result = await findAuditEvents(params);
  return {
    items: result.items.map(serializeAuditEvent),
    total: result.total,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
  };
}

export async function processSyncBatch(userId: string, input: SyncBatchInput) {
  let processed = 0;
  let failed = 0;
  const conflicts: Array<{ entityType: string; entityId: string; resolution: string }> = [];

  for (const item of input.items) {
    try {
      if (item.entityType === 'count_line' && item.operation === 'update') {
        const payload = item.payload as UpsertCountLineInput & { sessionId: string };
        await upsertCountLine(payload.sessionId, userId, payload, input.deviceId, true);
      } else if (item.entityType === 'count_session' && item.operation === 'create') {
        await createSession(userId, item.payload as CreateCountSessionInput, input.deviceId);
      } else if (item.entityType === 'count_session' && item.operation === 'update') {
        const payload = item.payload as { sessionId: string; updates: Record<string, unknown> };
        await updateSession(payload.sessionId, userId, payload.updates as Parameters<typeof updateSession>[2], input.deviceId);
      }

      await recordSyncEvent({
        deviceId: input.deviceId,
        operation: item.operation,
        entityType: item.entityType,
        entityId: item.entityId,
        payload: item.payload,
        clientTimestamp: new Date(item.clientTimestamp),
        status: 'synced',
      });
      processed++;
    } catch (err) {
      failed++;
      await recordSyncEvent({
        deviceId: input.deviceId,
        operation: item.operation,
        entityType: item.entityType,
        entityId: item.entityId,
        payload: item.payload,
        clientTimestamp: new Date(item.clientTimestamp),
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { processed, failed, conflicts };
}

export async function getDashboard(storeId: string) {
  return getDashboardStats(storeId);
}

export async function getVarianceReport(storeId: string) {
  const sessions = await findSessions(storeId);
  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length === 0) return [];

  const lines = await db.select().from(countLines);
  const storeLines = lines.filter((l) => sessionIds.includes(l.sessionId));

  const byCategory = new Map<string, { name: string; expected: number; counted: number; variance: number; count: number }>();

  for (const line of storeLines) {
    const product = await findProductById(line.productId);
    if (!product) continue;
    const key = product.categoryId;
    const entry = byCategory.get(key) ?? {
      name: key,
      expected: 0,
      counted: 0,
      variance: 0,
      count: 0,
    };
    entry.expected += line.expectedQty;
    entry.counted += line.countedQty ?? 0;
    entry.variance += line.varianceQty ?? 0;
    entry.count += 1;
    byCategory.set(key, entry);
  }

  const cats = await findCategories(storeId);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));

  return Array.from(byCategory.entries()).map(([categoryId, data]) => ({
    categoryId,
    categoryName: catMap.get(categoryId) ?? 'Unknown',
    totalExpected: data.expected,
    totalCounted: data.counted,
    totalVariance: data.variance,
    lineCount: data.count,
  }));
}

export async function getLowStockReport(storeId: string) {
  const result = await findProducts({ storeId, limit: 100 });
  return result.items
    .filter((p) => p.expectedQty <= p.reorderLevel)
    .map(serializeProduct);
}

function serializeProduct(p: typeof products.$inferSelect) {
  return {
    id: p.id,
    storeId: p.storeId,
    sku: p.sku,
    name: p.name,
    categoryId: p.categoryId,
    subcategory: p.subcategory,
    brand: p.brand,
    unitType: p.unitType,
    barcodePrimary: p.barcodePrimary,
    barcodeAlternates: [] as string[],
    restrictedCategory: p.restrictedCategory,
    restrictedType: p.restrictedType,
    expectedQty: p.expectedQty,
    reorderLevel: p.reorderLevel,
    active: p.active,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function serializeSession(s: typeof countSessions.$inferSelect) {
  return {
    id: s.id,
    storeId: s.storeId,
    sessionName: s.sessionName,
    countType: s.countType,
    status: s.status,
    createdBy: s.createdBy,
    assignedTo: s.assignedTo,
    categoryIds: s.categoryIds,
    locationIds: s.locationIds,
    startedAt: s.startedAt?.toISOString() ?? null,
    submittedAt: s.submittedAt?.toISOString() ?? null,
    approvedAt: s.approvedAt?.toISOString() ?? null,
    notes: s.notes,
    syncStatus: s.syncStatus,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function serializeCountLine(l: typeof countLines.$inferSelect) {
  return {
    id: l.id,
    sessionId: l.sessionId,
    productId: l.productId,
    locationId: l.locationId,
    expectedQty: l.expectedQty,
    countedQty: l.countedQty,
    varianceQty: l.varianceQty,
    variancePercent: l.variancePercent,
    enteredBy: l.enteredBy,
    enteredAt: l.enteredAt?.toISOString() ?? null,
    lastEditedBy: l.lastEditedBy,
    lastEditedAt: l.lastEditedAt?.toISOString() ?? null,
    note: l.note,
    reasonCode: l.reasonCode,
    requiresApproval: l.requiresApproval,
    approved: l.approved,
    approvedBy: l.approvedBy,
    approvedAt: l.approvedAt?.toISOString() ?? null,
    syncStatus: l.syncStatus,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

function serializeAuditEvent(e: typeof auditEvents.$inferSelect) {
  return {
    id: e.id,
    entityType: e.entityType,
    entityId: e.entityId,
    action: e.action,
    oldValue: e.oldValue,
    newValue: e.newValue,
    userId: e.userId,
    timestamp: e.timestamp.toISOString(),
    deviceId: e.deviceId,
    offline: e.offline,
  };
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: string;
  storeId?: string;
}) {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new AppError(409, 'USER_EXISTS', 'User already exists');

  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role as typeof users.role.enumValues[number],
      storeId: input.storeId,
    })
    .returning();

  return toAuthUser(user);
}

export function requireRole(userRole: string, allowed: string[]) {
  if (!allowed.includes(userRole)) {
    throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
  }
}

export { UserRole };
