import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['owner', 'manager', 'staff']);
export const unitTypeEnum = pgEnum('unit_type', [
  'each',
  'pack',
  'carton',
  'bottle',
  'can',
  'pouch',
]);
export const restrictedTypeEnum = pgEnum('restricted_type', ['none', 'alcohol', 'tobacco']);
export const countTypeEnum = pgEnum('count_type', ['full', 'cycle', 'spot']);
export const sessionStatusEnum = pgEnum('session_status', [
  'draft',
  'in_progress',
  'review',
  'approved',
  'posted',
]);
export const syncStatusEnum = pgEnum('sync_status', ['synced', 'pending', 'failed']);
export const reasonCodeEnum = pgEnum('reason_code', [
  'breakage',
  'theft_suspected',
  'damaged',
  'expired',
  'receiving_mismatch',
  'unknown_shrink',
  'open_pack',
  'missing',
  'other',
]);
export const auditActionEnum = pgEnum('audit_action', [
  'login',
  'session_created',
  'line_counted',
  'line_edited',
  'reason_code_added',
  'recount_requested',
  'manager_approved',
  'session_posted',
  'sync_conflict_resolved',
  'product_updated',
  'user_updated',
]);
export const entityTypeEnum = pgEnum('entity_type', [
  'user',
  'product',
  'count_session',
  'count_line',
  'approval',
  'sync',
]);
export const syncOperationEnum = pgEnum('sync_operation', ['create', 'update', 'delete', 'approve']);

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  address: text('address'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id').references(() => stores.id),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: userRoleEnum('role').notNull().default('staff'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('users_store_idx').on(table.storeId), index('users_role_idx').on(table.role)],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    deviceId: text('device_id'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('refresh_tokens_user_idx').on(table.userId)],
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    parentId: uuid('parent_id'),
    restrictedCategory: boolean('restricted_category').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('categories_store_idx').on(table.storeId),
    uniqueIndex('categories_store_slug_idx').on(table.storeId, table.slug),
  ],
);

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id),
    name: text('name').notNull(),
    code: text('code').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('locations_store_idx').on(table.storeId),
    uniqueIndex('locations_store_code_idx').on(table.storeId, table.code),
  ],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    subcategory: text('subcategory'),
    brand: text('brand'),
    unitType: unitTypeEnum('unit_type').notNull().default('each'),
    barcodePrimary: text('barcode_primary'),
    restrictedCategory: boolean('restricted_category').notNull().default(false),
    restrictedType: restrictedTypeEnum('restricted_type').notNull().default('none'),
    expectedQty: real('expected_qty').notNull().default(0),
    reorderLevel: real('reorder_level').notNull().default(0),
    active: boolean('active').notNull().default(true),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('products_store_idx').on(table.storeId),
    index('products_category_idx').on(table.categoryId),
    index('products_sku_idx').on(table.sku),
    index('products_restricted_idx').on(table.restrictedCategory, table.restrictedType),
    uniqueIndex('products_store_sku_idx').on(table.storeId, table.sku),
  ],
);

export const productBarcodes = pgTable(
  'product_barcodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    barcode: text('barcode').notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('product_barcodes_barcode_idx').on(table.barcode),
    index('product_barcodes_product_idx').on(table.productId),
    uniqueIndex('product_barcodes_barcode_unique').on(table.barcode),
  ],
);

export const inventorySnapshots = pgTable(
  'inventory_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    locationId: uuid('location_id').references(() => locations.id),
    quantity: real('quantity').notNull().default(0),
    snapshotAt: timestamp('snapshot_at', { withTimezone: true }).notNull().defaultNow(),
    source: text('source').notNull().default('manual'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('inventory_snapshots_product_idx').on(table.productId),
    index('inventory_snapshots_store_idx').on(table.storeId),
  ],
);

export const countSessions = pgTable(
  'count_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id),
    sessionName: text('session_name').notNull(),
    countType: countTypeEnum('count_type').notNull(),
    status: sessionStatusEnum('status').notNull().default('draft'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    assignedTo: jsonb('assigned_to').$type<string[]>().notNull().default([]),
    categoryIds: jsonb('category_ids').$type<string[]>().notNull().default([]),
    locationIds: jsonb('location_ids').$type<string[]>().notNull().default([]),
    startedAt: timestamp('started_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    notes: text('notes'),
    syncStatus: syncStatusEnum('sync_status').notNull().default('synced'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('count_sessions_store_idx').on(table.storeId),
    index('count_sessions_status_idx').on(table.status),
    index('count_sessions_created_by_idx').on(table.createdBy),
  ],
);

export const countSessionAssignments = pgTable(
  'count_session_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => countSessions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    categoryId: uuid('category_id').references(() => categories.id),
    locationId: uuid('location_id').references(() => locations.id),
    completed: boolean('completed').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('count_session_assignments_session_idx').on(table.sessionId)],
);

export const countLines = pgTable(
  'count_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => countSessions.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id),
    expectedQty: real('expected_qty').notNull().default(0),
    countedQty: real('counted_qty'),
    varianceQty: real('variance_qty'),
    variancePercent: real('variance_percent'),
    enteredBy: uuid('entered_by').references(() => users.id),
    enteredAt: timestamp('entered_at', { withTimezone: true }),
    lastEditedBy: uuid('last_edited_by').references(() => users.id),
    lastEditedAt: timestamp('last_edited_at', { withTimezone: true }),
    note: text('note'),
    reasonCode: reasonCodeEnum('reason_code'),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    approved: boolean('approved').notNull().default(false),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    syncStatus: syncStatusEnum('sync_status').notNull().default('synced'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('count_lines_session_idx').on(table.sessionId),
    index('count_lines_product_idx').on(table.productId),
    index('count_lines_requires_approval_idx').on(table.requiresApproval),
    uniqueIndex('count_lines_session_product_location_idx').on(
      table.sessionId,
      table.productId,
      table.locationId,
    ),
  ],
);

export const approvals = pgTable(
  'approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').references(() => countSessions.id),
    lineId: uuid('line_id').references(() => countLines.id),
    approvedBy: uuid('approved_by')
      .notNull()
      .references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('approvals_session_idx').on(table.sessionId),
    index('approvals_line_idx').on(table.lineId),
  ],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: entityTypeEnum('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    action: auditActionEnum('action').notNull(),
    oldValue: jsonb('old_value').$type<Record<string, unknown>>(),
    newValue: jsonb('new_value').$type<Record<string, unknown>>(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    deviceId: text('device_id'),
    offline: boolean('offline').notNull().default(false),
  },
  (table) => [
    index('audit_events_entity_idx').on(table.entityType, table.entityId),
    index('audit_events_user_idx').on(table.userId),
    index('audit_events_timestamp_idx').on(table.timestamp),
  ],
);

export const syncEvents = pgTable(
  'sync_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deviceId: text('device_id').notNull(),
    operation: syncOperationEnum('operation').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    clientTimestamp: timestamp('client_timestamp', { withTimezone: true }).notNull(),
    serverTimestamp: timestamp('server_timestamp', { withTimezone: true }).notNull().defaultNow(),
    status: syncStatusEnum('status').notNull().default('synced'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sync_events_device_idx').on(table.deviceId),
    index('sync_events_entity_idx').on(table.entityType, table.entityId),
    index('sync_events_status_idx').on(table.status),
  ],
);

export const unresolvedScans = pgTable(
  'unresolved_scans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => countSessions.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id),
    barcode: text('barcode').notNull(),
    scannedBy: uuid('scanned_by')
      .notNull()
      .references(() => users.id),
    scannedAt: timestamp('scanned_at', { withTimezone: true }).notNull().defaultNow(),
    resolved: boolean('resolved').notNull().default(false),
  },
  (table) => [index('unresolved_scans_session_idx').on(table.sessionId)],
);
