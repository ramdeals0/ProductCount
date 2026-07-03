import { z } from 'zod';
import {
  AuditAction,
  CountType,
  EntityType,
  ReasonCode,
  RestrictedType,
  SessionStatus,
  UserRole,
  VarianceFilter,
} from './enums';

/** Roles allowed to access ShopCount Admin web app */
export const WEB_ADMIN_ROLES = [UserRole.OWNER, UserRole.MANAGER] as const;
export type WebAdminRole = (typeof WEB_ADMIN_ROLES)[number];

export const WebPermission = {
  DASHBOARD_VIEW: 'dashboard:view',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_IMPORT: 'products:import',
  PRODUCTS_EXPORT: 'products:export',
  CATEGORIES_MANAGE: 'categories:manage',
  LOCATIONS_MANAGE: 'locations:manage',
  SESSIONS_READ: 'sessions:read',
  SESSIONS_GOVERN: 'sessions:govern',
  LINES_REVIEW: 'lines:review',
  LINES_APPROVE: 'lines:approve',
  LINES_BULK_APPROVE: 'lines:bulk_approve',
  AUDIT_READ: 'audit:read',
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
  SYNC_HEALTH_VIEW: 'sync:health',
} as const;
export type WebPermission = (typeof WebPermission)[keyof typeof WebPermission];

const OWNER_PERMISSIONS: WebPermission[] = Object.values(WebPermission);

const MANAGER_PERMISSIONS: WebPermission[] = [
  WebPermission.DASHBOARD_VIEW,
  WebPermission.PRODUCTS_READ,
  WebPermission.PRODUCTS_WRITE,
  WebPermission.PRODUCTS_EXPORT,
  WebPermission.CATEGORIES_MANAGE,
  WebPermission.LOCATIONS_MANAGE,
  WebPermission.SESSIONS_READ,
  WebPermission.SESSIONS_GOVERN,
  WebPermission.LINES_REVIEW,
  WebPermission.LINES_APPROVE,
  WebPermission.LINES_BULK_APPROVE,
  WebPermission.AUDIT_READ,
  WebPermission.USERS_READ,
  WebPermission.SYNC_HEALTH_VIEW,
];

export const ROLE_PERMISSIONS: Record<WebAdminRole, WebPermission[]> = {
  [UserRole.OWNER]: OWNER_PERMISSIONS,
  [UserRole.MANAGER]: MANAGER_PERMISSIONS,
};

export function canAccess(role: string, permission: WebPermission): boolean {
  if (role === UserRole.OWNER) return true;
  if (role === UserRole.MANAGER) return MANAGER_PERMISSIONS.includes(permission);
  return false;
}

export function isWebAdminRole(role: string): role is WebAdminRole {
  return (WEB_ADMIN_ROLES as readonly string[]).includes(role);
}

// ─── List / filter schemas ───────────────────────────────────────────────────

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});

export const productListFilterSchema = paginationSchema.extend({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  restrictedType: z
    .enum([RestrictedType.NONE, RestrictedType.ALCOHOL, RestrictedType.TOBACCO])
    .optional(),
  active: z.coerce.boolean().optional(),
  storeId: z.string().uuid().optional(),
});

export const sessionListFilterSchema = paginationSchema.extend({
  status: z
    .enum([
      SessionStatus.DRAFT,
      SessionStatus.IN_PROGRESS,
      SessionStatus.REVIEW,
      SessionStatus.APPROVED,
      SessionStatus.POSTED,
    ])
    .optional(),
  countType: z.enum([CountType.FULL, CountType.CYCLE, CountType.SPOT]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  storeId: z.string().uuid().optional(),
});

export const auditEventFilterSchema = paginationSchema.extend({
  entityType: z
    .enum([
      EntityType.USER,
      EntityType.PRODUCT,
      EntityType.COUNT_SESSION,
      EntityType.COUNT_LINE,
      EntityType.APPROVAL,
      EntityType.SYNC,
    ])
    .optional(),
  action: z
    .enum([
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
    ])
    .optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  q: z.string().optional(),
});

export const countLineReviewFilterSchema = paginationSchema.extend({
  sessionId: z.string().uuid(),
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
  locationId: z.string().uuid().optional(),
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
});

// ─── Category & location CRUD ──────────────────────────────────────────────

export const createCategorySchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  parentId: z.string().uuid().nullable().optional(),
  restrictedCategory: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema
  .omit({ storeId: true })
  .partial();

export const createLocationSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric'),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const updateLocationSchema = createLocationSchema
  .omit({ storeId: true })
  .partial();

// ─── Store settings (Phase 4 — API + migration) ────────────────────────────

export const storeSettingsSchema = z.object({
  storeId: z.string().uuid(),
  varianceAutoApprovePercent: z.number().min(0).max(100).default(10),
  varianceAutoApprovePercentRestricted: z.number().min(0).max(100).default(5),
  varianceAutoApproveQtyRestricted: z.number().min(0).default(2),
  defaultCountType: z.enum([CountType.FULL, CountType.CYCLE, CountType.SPOT]).default(CountType.CYCLE),
  notifyRestrictedVariance: z.boolean().default(true),
  timezone: z.string().default('America/New_York'),
});

export const updateStoreSettingsSchema = storeSettingsSchema.omit({ storeId: true }).partial();

export const storeProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().nullable().optional(),
  timezone: z.string().optional(),
  active: z.boolean().default(true),
});

export const updateStoreProfileSchema = storeProfileSchema
  .omit({ id: true, code: true })
  .partial();

// ─── Bulk product import (scaffold) ────────────────────────────────────────

export const productImportRowSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  categorySlug: z.string().min(1),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  unitType: z.string().optional(),
  barcodePrimary: z.string().optional(),
  barcodeAlternates: z.string().optional(), // comma-separated
  restrictedCategory: z.coerce.boolean().optional(),
  restrictedType: z.enum(['none', 'alcohol', 'tobacco']).optional(),
  expectedQty: z.coerce.number().min(0).optional(),
  reorderLevel: z.coerce.number().min(0).optional(),
  active: z.coerce.boolean().optional(),
  imageUrl: z.string().url().optional(),
});

export const productImportRequestSchema = z.object({
  storeId: z.string().uuid(),
  rows: z.array(productImportRowSchema).min(1).max(1000),
  dryRun: z.boolean().default(true),
});

export const productImportResultSchema = z.object({
  dryRun: z.boolean(),
  totalRows: z.number(),
  created: z.number(),
  updated: z.number(),
  skipped: z.number(),
  errors: z.array(
    z.object({
      row: z.number(),
      sku: z.string().optional(),
      message: z.string(),
    }),
  ),
});

// ─── Bulk line actions ─────────────────────────────────────────────────────

export const bulkLineActionSchema = z.object({
  lineIds: z.array(z.string().uuid()).min(1),
  notes: z.string().optional(),
});

export const bulkApproveLowVarianceSchema = z.object({
  sessionId: z.string().uuid(),
  maxVariancePercent: z.number().min(0).max(100).default(5),
  maxVarianceQty: z.number().min(0).default(2),
  excludeRestricted: z.boolean().default(true),
});

// ─── Dashboard & system health types ───────────────────────────────────────

export interface StockByCategoryRow {
  categoryId: string;
  categoryName: string;
  productCount: number;
  totalUnits: number;
  lowStockCount: number;
}

export interface VarianceTrendPoint {
  date: string;
  shortageUnits: number;
  overageUnits: number;
  netVariance: number;
}

export interface SessionStatusCount {
  status: string;
  count: number;
}

export interface RestrictedOverview {
  alcoholCount: number;
  tobaccoCount: number;
  recentHighVariance: Array<{
    productId: string;
    productName: string;
    sku: string;
    varianceQty: number;
    sessionId: string;
    sessionName: string;
  }>;
}

export interface ShrinkByReasonRow {
  reasonCode: string;
  lineCount: number;
  totalVarianceQty: number;
}

export interface SystemHealth {
  lastSyncAt: string | null;
  pendingSyncEvents: number;
  failedSyncEvents: number;
  activeDevices: number;
}

export interface DashboardExtendedStats {
  activeSessions: number;
  pendingReview: number;
  restrictedVariances: number;
  lowStockItems: number;
  syncIssues: number;
  stockByCategory: StockByCategoryRow[];
  lowStockTop10: Array<{
    productId: string;
    name: string;
    sku: string;
    expectedQty: number;
    reorderLevel: number;
  }>;
  varianceTrend: VarianceTrendPoint[];
  varianceByCategory: Array<{
    categoryId: string;
    categoryName: string;
    shortageUnits: number;
    overageUnits: number;
  }>;
  shrinkByReason: ShrinkByReasonRow[];
  sessionsByStatus: SessionStatusCount[];
  restrictedOverview: RestrictedOverview;
  systemHealth: SystemHealth;
}

// ─── Inferred types ────────────────────────────────────────────────────────

export type ProductListFilter = z.infer<typeof productListFilterSchema>;
export type SessionListFilter = z.infer<typeof sessionListFilterSchema>;
export type AuditEventFilter = z.infer<typeof auditEventFilterSchema>;
export type CountLineReviewFilter = z.infer<typeof countLineReviewFilterSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type StoreSettings = z.infer<typeof storeSettingsSchema>;
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
export type ProductImportRow = z.infer<typeof productImportRowSchema>;
export type ProductImportRequest = z.infer<typeof productImportRequestSchema>;
export type ProductImportResult = z.infer<typeof productImportResultSchema>;
