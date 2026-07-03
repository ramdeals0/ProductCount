'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { EmptyState, ErrorBanner, PageShell, TableSkeleton } from '@/components/ui/page-shell';
import { ProductTable } from '@/components/products/product-table';
import { useCategories, useProducts } from '@/hooks/use-api';
import { apiDownload, apiRequest } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useQueryClient } from '@tanstack/react-query';

export default function ProductsPage() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [restrictedType, setRestrictedType] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const { data: categories = [] } = useCategories();
  const { data, isLoading, error } = useProducts({
    q: q || undefined,
    categoryId: categoryId || undefined,
    restrictedType: restrictedType || undefined,
    includeInactive,
    limit,
    offset,
  });

  async function patchProduct(id: string, body: Record<string, unknown>) {
    const token = useAuthStore.getState().token;
    await apiRequest(`/products/${id}`, { method: 'PATCH', token, body });
    await qc.invalidateQueries({ queryKey: ['products'] });
  }

  return (
    <>
      <Header
        title="Products"
        description="Product master catalog used by ShopCount mobile"
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => token && apiDownload('/products/export', token, 'products.csv')}
            >
              Export CSV
            </button>
            <Link href="/products/new" className="btn-primary">
              Add product
            </Link>
          </>
        }
      />
      <PageShell>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            className="input max-w-xs"
            placeholder="Search name, SKU, barcode…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOffset(0); }}
          />
          <select className="input max-w-[180px]" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setOffset(0); }}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>
            ))}
          </select>
          <select className="input max-w-[160px]" value={restrictedType} onChange={(e) => { setRestrictedType(e.target.value); setOffset(0); }}>
            <option value="">All restricted</option>
            <option value="none">None</option>
            <option value="alcohol">Alcohol</option>
            <option value="tobacco">Tobacco</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
            Show inactive
          </label>
        </div>

        {error && <ErrorBanner message={error.message} />}
        {isLoading && <TableSkeleton rows={8} cols={6} />}

        {!isLoading && data?.items.length === 0 && (
          <EmptyState
            title="No products found"
            description="Add your first product or adjust filters."
            action={<Link href="/products/new" className="btn-primary">Add product</Link>}
          />
        )}

        {data && data.items.length > 0 && (
          <>
            <ProductTable
              products={data.items}
              categories={categories.map((c) => ({ id: String(c.id), name: String(c.name) }))}
              onToggleActive={(id, active) => patchProduct(id, { active })}
              onToggleRestricted={(id, restrictedCategory) => patchProduct(id, { restrictedCategory })}
              onQuickEdit={(id, field, value) => patchProduct(id, { [field]: value })}
            />
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>{data.total} products total</span>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
                  Previous
                </button>
                <button type="button" className="btn-secondary" disabled={offset + limit >= data.total} onClick={() => setOffset(offset + limit)}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </PageShell>
    </>
  );
}
