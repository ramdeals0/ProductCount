import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const localProducts = sqliteTable('products', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull(),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  categoryId: text('category_id').notNull(),
  subcategory: text('subcategory'),
  brand: text('brand'),
  unitType: text('unit_type').notNull(),
  barcodePrimary: text('barcode_primary'),
  barcodeAlternates: text('barcode_alternates'),
  restrictedCategory: integer('restricted_category', { mode: 'boolean' }).notNull().default(false),
  restrictedType: text('restricted_type').notNull().default('none'),
  expectedQty: real('expected_qty').notNull().default(0),
  reorderLevel: real('reorder_level').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  imageUrl: text('image_url'),
  updatedAt: text('updated_at').notNull(),
});

export const localCategories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  restrictedCategory: integer('restricted_category', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const localLocations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const localSessions = sqliteTable('count_sessions', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull(),
  sessionName: text('session_name').notNull(),
  countType: text('count_type').notNull(),
  status: text('status').notNull(),
  createdBy: text('created_by').notNull(),
  assignedTo: text('assigned_to').notNull(),
  categoryIds: text('category_ids').notNull(),
  locationIds: text('location_ids').notNull(),
  startedAt: text('started_at'),
  submittedAt: text('submitted_at'),
  approvedAt: text('approved_at'),
  notes: text('notes'),
  syncStatus: text('sync_status').notNull().default('synced'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const localCountLines = sqliteTable('count_lines', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  productId: text('product_id').notNull(),
  locationId: text('location_id').notNull(),
  expectedQty: real('expected_qty').notNull().default(0),
  countedQty: real('counted_qty'),
  varianceQty: real('variance_qty'),
  variancePercent: real('variance_percent'),
  enteredBy: text('entered_by'),
  enteredAt: text('entered_at'),
  lastEditedBy: text('last_edited_by'),
  lastEditedAt: text('last_edited_at'),
  note: text('note'),
  reasonCode: text('reason_code'),
  requiresApproval: integer('requires_approval', { mode: 'boolean' }).notNull().default(false),
  approved: integer('approved', { mode: 'boolean' }).notNull().default(false),
  syncStatus: text('sync_status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  operation: text('operation').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  payload: text('payload').notNull(),
  clientTimestamp: text('client_timestamp').notNull(),
  deviceId: text('device_id').notNull(),
  retryCount: integer('retry_count').notNull().default(0),
  status: text('status').notNull().default('pending'),
});

export const localAuditEvents = sqliteTable('audit_events', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  userId: text('user_id').notNull(),
  timestamp: text('timestamp').notNull(),
  deviceId: text('device_id'),
  offline: integer('offline', { mode: 'boolean' }).notNull().default(false),
  syncStatus: text('sync_status').notNull().default('pending'),
});

export const unresolvedScans = sqliteTable('unresolved_scans', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  locationId: text('location_id').notNull(),
  barcode: text('barcode').notNull(),
  scannedAt: text('scanned_at').notNull(),
  scannedBy: text('scanned_by').notNull(),
  syncStatus: text('sync_status').notNull().default('pending'),
});
