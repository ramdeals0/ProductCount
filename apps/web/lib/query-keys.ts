export const queryKeys = {
  me: ['auth', 'me'] as const,
  dashboard: (storeId: string) => ['dashboard', storeId] as const,
  products: (filters: Record<string, unknown>) => ['products', filters] as const,
  product: (id: string) => ['product', id] as const,
  categories: (storeId: string) => ['categories', storeId] as const,
  locations: (storeId: string) => ['locations', storeId] as const,
};
