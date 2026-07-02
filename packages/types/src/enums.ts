export const UserRole = {
  OWNER: 'owner',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UnitType = {
  EACH: 'each',
  PACK: 'pack',
  CARTON: 'carton',
  BOTTLE: 'bottle',
  CAN: 'can',
  POUCH: 'pouch',
} as const;
export type UnitType = (typeof UnitType)[keyof typeof UnitType];

export const RestrictedType = {
  NONE: 'none',
  ALCOHOL: 'alcohol',
  TOBACCO: 'tobacco',
} as const;
export type RestrictedType = (typeof RestrictedType)[keyof typeof RestrictedType];

export const CountType = {
  FULL: 'full',
  CYCLE: 'cycle',
  SPOT: 'spot',
} as const;
export type CountType = (typeof CountType)[keyof typeof CountType];

export const SessionStatus = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  APPROVED: 'approved',
  POSTED: 'posted',
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  FAILED: 'failed',
} as const;
export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

export const ReasonCode = {
  BREAKAGE: 'breakage',
  THEFT_SUSPECTED: 'theft_suspected',
  DAMAGED: 'damaged',
  EXPIRED: 'expired',
  RECEIVING_MISMATCH: 'receiving_mismatch',
  UNKNOWN_SHRINK: 'unknown_shrink',
  OPEN_PACK: 'open_pack',
  MISSING: 'missing',
  OTHER: 'other',
} as const;
export type ReasonCode = (typeof ReasonCode)[keyof typeof ReasonCode];

export const AuditAction = {
  LOGIN: 'login',
  SESSION_CREATED: 'session_created',
  LINE_COUNTED: 'line_counted',
  LINE_EDITED: 'line_edited',
  REASON_CODE_ADDED: 'reason_code_added',
  RECOUNT_REQUESTED: 'recount_requested',
  MANAGER_APPROVED: 'manager_approved',
  SESSION_POSTED: 'session_posted',
  SYNC_CONFLICT_RESOLVED: 'sync_conflict_resolved',
  PRODUCT_UPDATED: 'product_updated',
  USER_UPDATED: 'user_updated',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const EntityType = {
  USER: 'user',
  PRODUCT: 'product',
  COUNT_SESSION: 'count_session',
  COUNT_LINE: 'count_line',
  APPROVAL: 'approval',
  SYNC: 'sync',
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const VarianceFilter = {
  ALL: 'all',
  MATCHED: 'matched',
  SHORTAGE: 'shortage',
  OVERAGE: 'overage',
  RESTRICTED: 'restricted',
  UNCOUNTED: 'uncounted',
  NEEDS_APPROVAL: 'needs_approval',
} as const;
export type VarianceFilter = (typeof VarianceFilter)[keyof typeof VarianceFilter];

export const SyncOperation = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
} as const;
export type SyncOperation = (typeof SyncOperation)[keyof typeof SyncOperation];

export const RESTRICTED_VARIANCE_THRESHOLD_PERCENT = 5;
export const RESTRICTED_VARIANCE_THRESHOLD_QTY = 2;
