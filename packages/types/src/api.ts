import type {
  AuditEvent,
  Category,
  CountLine,
  CountSession,
  Location,
  Product,
} from './schemas';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  storeId: string | null;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface DashboardStats {
  activeSessions: number;
  pendingReview: number;
  restrictedVariances: number;
  lowStockItems: number;
  syncIssues: number;
}

export interface VarianceReportRow {
  categoryId: string;
  categoryName: string;
  totalExpected: number;
  totalCounted: number;
  totalVariance: number;
  lineCount: number;
}

export interface ShrinkReportRow {
  productId: string;
  productName: string;
  sku: string;
  expectedQty: number;
  countedQty: number;
  varianceQty: number;
  reasonCode: string | null;
  restrictedType: string;
}

export interface CountCompletionReport {
  sessionId: string;
  sessionName: string;
  totalLines: number;
  countedLines: number;
  completionPercent: number;
  status: string;
}

export interface ProductWithCategory extends Product {
  category?: Category;
  barcodes?: string[];
}

export interface CountLineWithProduct extends CountLine {
  product?: ProductWithCategory;
  location?: Location;
}

export interface CountSessionWithProgress extends CountSession {
  totalLines: number;
  countedLines: number;
  completionPercent: number;
  varianceCount: number;
}

export interface AuditEventList extends PaginatedResponse<AuditEvent> {}

export interface SyncResult {
  processed: number;
  failed: number;
  conflicts: Array<{
    entityType: string;
    entityId: string;
    resolution: string;
  }>;
}

export interface UnresolvedScan {
  id: string;
  barcode: string;
  sessionId: string;
  locationId: string;
  scannedAt: string;
  scannedBy: string;
}
