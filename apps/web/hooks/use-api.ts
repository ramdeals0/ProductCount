'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AuditEvent,
  CountSessionWithProgress,
  DashboardExtendedStats,
  PaginatedResponse,
  Product,
  StoreSettings,
} from '@shopcount/types';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/auth-store';

export interface CountLineRow {
  id: string;
  sessionId: string;
  productId: string;
  locationId: string;
  expectedQty: number;
  countedQty: number | null;
  varianceQty: number | null;
  variancePercent: number | null;
  reasonCode: string | null;
  note: string | null;
  requiresApproval: boolean;
  approved: boolean;
  product?: Product;
  location?: { id: string; name: string; code: string };
  restrictedCategory?: boolean;
}

export interface AuditEventRow extends AuditEvent {
  userName?: string;
}

export function useProducts(filters: {
  q?: string;
  categoryId?: string;
  restrictedType?: string;
  active?: boolean;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}) {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);

  return useQuery({
    queryKey: queryKeys.products({ ...filters, storeId }),
    enabled: !!token && !!storeId,
    queryFn: () => {
      const params = new URLSearchParams({ storeId: storeId! });
      if (filters.q) params.set('q', filters.q);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.restrictedType) params.set('restrictedType', filters.restrictedType);
      if (filters.active !== undefined) params.set('active', String(filters.active));
      if (filters.includeInactive) params.set('includeInactive', 'true');
      params.set('limit', String(filters.limit ?? 25));
      params.set('offset', String(filters.offset ?? 0));
      return apiRequest<PaginatedResponse<Product>>(`/products?${params}`, { token });
    },
  });
}

export function useProduct(id: string) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: queryKeys.product(id),
    enabled: !!token && !!id,
    queryFn: () => apiRequest<Product>(`/products/${id}`, { token }),
  });
}

export function useCreateProduct() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<Product>('/products', {
        method: 'POST',
        token,
        body: { ...body, storeId },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct(id: string) {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<Product>(`/products/${id}`, { method: 'PATCH', token, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: queryKeys.product(id) });
    },
  });
}

export function useCategories() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);

  return useQuery({
    queryKey: queryKeys.categories(storeId ?? ''),
    enabled: !!token && !!storeId,
    queryFn: () => apiRequest<Array<Record<string, unknown>>>(`/categories?storeId=${storeId}`, { token }),
  });
}

export function useCategoryMutations() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] });

  return {
    create: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        apiRequest('/categories', { method: 'POST', token, body: { ...body, storeId } }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        apiRequest(`/categories/${id}`, { method: 'PATCH', token, body }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        apiRequest(`/categories/${id}`, { method: 'DELETE', token }),
      onSuccess: invalidate,
    }),
  };
}

export function useLocations() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);

  return useQuery({
    queryKey: queryKeys.locations(storeId ?? ''),
    enabled: !!token && !!storeId,
    queryFn: () => apiRequest<Array<Record<string, unknown>>>(`/locations?storeId=${storeId}`, { token }),
  });
}

export function useLocationMutations() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['locations'] });

  return {
    create: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        apiRequest('/locations', { method: 'POST', token, body: { ...body, storeId } }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
        apiRequest(`/locations/${id}`, { method: 'PATCH', token, body }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) =>
        apiRequest(`/locations/${id}`, { method: 'DELETE', token }),
      onSuccess: invalidate,
    }),
  };
}

export function useDashboard() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);

  return useQuery({
    queryKey: queryKeys.dashboard(storeId ?? ''),
    enabled: !!token && !!storeId,
    queryFn: () =>
      apiRequest<Record<string, number>>(`/dashboard?storeId=${storeId}`, { token }),
  });
}

export function useExtendedDashboard() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);

  return useQuery({
    queryKey: queryKeys.dashboardExtended(storeId ?? ''),
    enabled: !!token && !!storeId,
    queryFn: () =>
      apiRequest<DashboardExtendedStats>(`/dashboard/extended?storeId=${storeId}`, { token }),
  });
}

export function useSyncHealth() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: queryKeys.syncHealth,
    enabled: !!token,
    queryFn: () => apiRequest<Record<string, unknown>>('/sync/health', { token }),
  });
}

export function useSessions(filters: { status?: string; countType?: string } = {}) {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);

  return useQuery({
    queryKey: queryKeys.sessions({ ...filters, storeId }),
    enabled: !!token && !!storeId,
    queryFn: async () => {
      const params = new URLSearchParams({ storeId: storeId! });
      if (filters.status) params.set('status', filters.status);
      const sessions = await apiRequest<CountSessionWithProgress[]>(`/count-sessions?${params}`, { token });
      if (filters.countType) {
        return sessions.filter((s) => s.countType === filters.countType);
      }
      return sessions;
    },
  });
}

export function useSession(id: string) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: queryKeys.session(id),
    enabled: !!token && !!id,
    queryFn: () => apiRequest<CountSessionWithProgress>(`/count-sessions/${id}`, { token }),
  });
}

export function useSessionLines(sessionId: string, filter?: string) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: queryKeys.sessionLines(sessionId, filter),
    enabled: !!token && !!sessionId,
    queryFn: () => {
      const params = filter ? `?filter=${filter}` : '';
      return apiRequest<CountLineRow[]>(`/count-sessions/${sessionId}/lines${params}`, { token });
    },
  });
}

export function useSessionMutations(sessionId: string) {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
    qc.invalidateQueries({ queryKey: ['session', sessionId, 'lines'] });
    qc.invalidateQueries({ queryKey: ['sessions'] });
  };

  return {
    updateStatus: useMutation({
      mutationFn: (body: { status?: string; notes?: string }) =>
        apiRequest(`/count-sessions/${sessionId}`, { method: 'PATCH', token, body }),
      onSuccess: invalidate,
    }),
    approveSession: useMutation({
      mutationFn: (notes?: string) =>
        apiRequest(`/count-sessions/${sessionId}/approve`, { method: 'POST', token, body: { notes } }),
      onSuccess: invalidate,
    }),
    approveLine: useMutation({
      mutationFn: ({ lineId, notes }: { lineId: string; notes?: string }) =>
        apiRequest(`/count-sessions/${sessionId}/lines/${lineId}/approve`, {
          method: 'POST',
          token,
          body: { notes },
        }),
      onSuccess: invalidate,
    }),
    recountLine: useMutation({
      mutationFn: ({ lineId, notes }: { lineId: string; notes?: string }) =>
        apiRequest(`/count-sessions/${sessionId}/lines/${lineId}/recount`, {
          method: 'POST',
          token,
          body: { notes },
        }),
      onSuccess: invalidate,
    }),
    bulkApprove: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        apiRequest(`/count-sessions/${sessionId}/lines/bulk-approve`, {
          method: 'POST',
          token,
          body,
        }),
      onSuccess: invalidate,
    }),
    bulkRecount: useMutation({
      mutationFn: (body: { lineIds: string[]; notes?: string }) =>
        apiRequest(`/count-sessions/${sessionId}/lines/bulk-recount`, {
          method: 'POST',
          token,
          body,
        }),
      onSuccess: invalidate,
    }),
  };
}

export function useAuditEvents(filters: {
  entityType?: string;
  action?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: queryKeys.audit(filters),
    enabled: !!token,
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.action) params.set('action', filters.action);
      if (filters.q) params.set('q', filters.q);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      params.set('limit', String(filters.limit ?? 25));
      params.set('offset', String(filters.offset ?? 0));
      return apiRequest<PaginatedResponse<AuditEventRow>>(`/audit-events?${params}`, { token });
    },
  });
}

export function useUsers() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);

  return useQuery({
    queryKey: queryKeys.users(storeId ?? ''),
    enabled: !!token && !!storeId,
    queryFn: () => apiRequest<Array<Record<string, unknown>>>(`/users?storeId=${storeId}`, { token }),
  });
}

export function useStoreProfile() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);

  return useQuery({
    queryKey: queryKeys.storeProfile(storeId ?? ''),
    enabled: !!token && !!storeId,
    queryFn: () => apiRequest<Record<string, unknown>>(`/stores/${storeId}`, { token }),
  });
}

export function useStoreSettings() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);

  return useQuery({
    queryKey: queryKeys.storeSettings(storeId ?? ''),
    enabled: !!token && !!storeId,
    queryFn: () => apiRequest<StoreSettings>(`/stores/${storeId}/settings`, { token }),
  });
}

export function useStoreMutations() {
  const token = useAuthStore((s) => s.token);
  const storeId = useAuthStore((s) => s.user?.storeId);
  const qc = useQueryClient();

  return {
    updateProfile: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        apiRequest(`/stores/${storeId}`, { method: 'PATCH', token, body }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['store'] }),
    }),
    updateSettings: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        apiRequest(`/stores/${storeId}/settings`, { method: 'PATCH', token, body }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['store'] }),
    }),
    createUser: useMutation({
      mutationFn: (body: Record<string, unknown>) =>
        apiRequest('/users', { method: 'POST', token, body: { ...body, storeId } }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    }),
  };
}
