import { z } from 'zod';
import {
  AuditAction,
  CountType,
  EntityType,
  ReasonCode,
  RestrictedType,
  SessionStatus,
  SyncOperation,
  SyncStatus,
  UnitType,
  UserRole,
  VarianceFilter,
} from './enums';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  deviceId: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum([UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF]),
  storeId: z.string().uuid().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
  active: z.boolean().optional(),
});

export const productSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  sku: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().uuid(),
  subcategory: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  unitType: z.enum([
    UnitType.EACH,
    UnitType.PACK,
    UnitType.CARTON,
    UnitType.BOTTLE,
    UnitType.CAN,
    UnitType.POUCH,
  ]),
  barcodePrimary: z.string().nullable().optional(),
  barcodeAlternates: z.array(z.string()).default([]),
  restrictedCategory: z.boolean().default(false),
  restrictedType: z
    .enum([RestrictedType.NONE, RestrictedType.ALCOHOL, RestrictedType.TOBACCO])
    .default(RestrictedType.NONE),
  expectedQty: z.number().default(0),
  reorderLevel: z.number().default(0),
  active: z.boolean().default(true),
  imageUrl: z.union([z.string().url(), z.literal('')]).nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createProductSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProductSchema = createProductSchema.partial();

export const categorySchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().uuid().nullable().optional(),
  restrictedCategory: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

export const locationSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  active: z.boolean().default(true),
});

export const countSessionSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  sessionName: z.string(),
  countType: z.enum([CountType.FULL, CountType.CYCLE, CountType.SPOT]),
  status: z.enum([
    SessionStatus.DRAFT,
    SessionStatus.IN_PROGRESS,
    SessionStatus.REVIEW,
    SessionStatus.APPROVED,
    SessionStatus.POSTED,
  ]),
  createdBy: z.string().uuid(),
  assignedTo: z.array(z.string().uuid()).default([]),
  categoryIds: z.array(z.string().uuid()).default([]),
  locationIds: z.array(z.string().uuid()).default([]),
  startedAt: z.string().datetime().nullable().optional(),
  submittedAt: z.string().datetime().nullable().optional(),
  approvedAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  syncStatus: z
    .enum([SyncStatus.SYNCED, SyncStatus.PENDING, SyncStatus.FAILED])
    .default(SyncStatus.SYNCED),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createCountSessionSchema = z.object({
  storeId: z.string().uuid(),
  sessionName: z.string().min(1),
  countType: z.enum([CountType.FULL, CountType.CYCLE, CountType.SPOT]),
  assignedTo: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  locationIds: z.array(z.string().uuid()).optional(),
  notes: z.string().optional(),
});

export const updateCountSessionSchema = z.object({
  sessionName: z.string().min(1).optional(),
  status: z
    .enum([
      SessionStatus.DRAFT,
      SessionStatus.IN_PROGRESS,
      SessionStatus.REVIEW,
      SessionStatus.APPROVED,
      SessionStatus.POSTED,
    ])
    .optional(),
  assignedTo: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  locationIds: z.array(z.string().uuid()).optional(),
  notes: z.string().optional(),
});

export const countLineSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  expectedQty: z.number(),
  countedQty: z.number().nullable(),
  varianceQty: z.number().nullable(),
  variancePercent: z.number().nullable(),
  enteredBy: z.string().uuid().nullable().optional(),
  enteredAt: z.string().datetime().nullable().optional(),
  lastEditedBy: z.string().uuid().nullable().optional(),
  lastEditedAt: z.string().datetime().nullable().optional(),
  note: z.string().nullable().optional(),
  reasonCode: z
    .enum([
      ReasonCode.BREAKAGE,
      ReasonCode.THEFT_SUSPECTED,
      ReasonCode.DAMAGED,
      ReasonCode.EXPIRED,
      ReasonCode.RECEIVING_MISMATCH,
      ReasonCode.UNKNOWN_SHRINK,
      ReasonCode.OPEN_PACK,
      ReasonCode.MISSING,
      ReasonCode.OTHER,
    ])
    .nullable()
    .optional(),
  requiresApproval: z.boolean().default(false),
  approved: z.boolean().default(false),
  approvedBy: z.string().uuid().nullable().optional(),
  approvedAt: z.string().datetime().nullable().optional(),
  syncStatus: z
    .enum([SyncStatus.SYNCED, SyncStatus.PENDING, SyncStatus.FAILED])
    .default(SyncStatus.SYNCED),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const upsertCountLineSchema = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  countedQty: z.number().min(0),
  note: z.string().optional(),
  reasonCode: z
    .enum([
      ReasonCode.BREAKAGE,
      ReasonCode.THEFT_SUSPECTED,
      ReasonCode.DAMAGED,
      ReasonCode.EXPIRED,
      ReasonCode.RECEIVING_MISMATCH,
      ReasonCode.UNKNOWN_SHRINK,
      ReasonCode.OPEN_PACK,
      ReasonCode.MISSING,
      ReasonCode.OTHER,
    ])
    .optional(),
  increment: z.boolean().optional(),
});

export const approvalSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid().nullable().optional(),
  lineId: z.string().uuid().nullable().optional(),
  approvedBy: z.string().uuid(),
  approvedAt: z.string().datetime(),
  notes: z.string().nullable().optional(),
});

export const auditEventSchema = z.object({
  id: z.string().uuid(),
  entityType: z.enum([
    EntityType.USER,
    EntityType.PRODUCT,
    EntityType.COUNT_SESSION,
    EntityType.COUNT_LINE,
    EntityType.APPROVAL,
    EntityType.SYNC,
  ]),
  entityId: z.string(),
  action: z.enum([
    AuditAction.LOGIN,
    AuditAction.SESSION_CREATED,
    AuditAction.LINE_COUNTED,
    AuditAction.LINE_EDITED,
    AuditAction.REASON_CODE_ADDED,
    AuditAction.RECOUNT_REQUESTED,
    AuditAction.MANAGER_APPROVED,
    AuditAction.SESSION_POSTED,
    AuditAction.SYNC_CONFLICT_RESOLVED,
    AuditAction.PRODUCT_UPDATED,
    AuditAction.USER_UPDATED,
  ]),
  oldValue: z.record(z.unknown()).nullable().optional(),
  newValue: z.record(z.unknown()).nullable().optional(),
  userId: z.string().uuid(),
  timestamp: z.string().datetime(),
  deviceId: z.string().nullable().optional(),
  offline: z.boolean().default(false),
});

export const syncQueueItemSchema = z.object({
  id: z.string().uuid(),
  operation: z.enum([
    SyncOperation.CREATE,
    SyncOperation.UPDATE,
    SyncOperation.DELETE,
    SyncOperation.APPROVE,
  ]),
  entityType: z.string(),
  entityId: z.string(),
  payload: z.record(z.unknown()),
  clientTimestamp: z.string().datetime(),
  deviceId: z.string(),
  retryCount: z.number().default(0),
});

export const syncBatchSchema = z.object({
  deviceId: z.string(),
  items: z.array(syncQueueItemSchema),
});

export const varianceReviewFilterSchema = z.object({
  filter: z
    .enum([
      VarianceFilter.ALL,
      VarianceFilter.MATCHED,
      VarianceFilter.SHORTAGE,
      VarianceFilter.OVERAGE,
      VarianceFilter.RESTRICTED,
      VarianceFilter.UNCOUNTED,
      VarianceFilter.NEEDS_APPROVAL,
    ])
    .default(VarianceFilter.ALL),
});

export const barcodeLookupSchema = z.object({
  barcode: z.string().min(1),
  storeId: z.string().uuid(),
});

export const productSearchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  restrictedOnly: z.coerce.boolean().optional(),
  restrictedType: z
    .enum([RestrictedType.NONE, RestrictedType.ALCOHOL, RestrictedType.TOBACCO])
    .optional(),
  active: z.coerce.boolean().optional(),
  includeInactive: z.coerce.boolean().optional(),
  storeId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type Product = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Location = z.infer<typeof locationSchema>;
export type CountSession = z.infer<typeof countSessionSchema>;
export type CreateCountSessionInput = z.infer<typeof createCountSessionSchema>;
export type CountLine = z.infer<typeof countLineSchema>;
export type UpsertCountLineInput = z.infer<typeof upsertCountLineSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type SyncBatchInput = z.infer<typeof syncBatchSchema>;
export type SyncQueueItem = z.infer<typeof syncQueueItemSchema>;
