'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginatedResponse, Product } from '@shopcount/types';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/auth-store';

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
