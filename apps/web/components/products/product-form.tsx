'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@shopcount/types';
import { UnitType, RestrictedType } from '@shopcount/types';
import { useCategories } from '@/hooks/use-api';

const UNIT_OPTIONS = Object.values(UnitType);
const RESTRICTED_OPTIONS = Object.values(RestrictedType);

export function ProductForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Product>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
}) {
  const { data: categories = [] } = useCategories();
  const router = useRouter();
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    sku: initial?.sku ?? '',
    name: initial?.name ?? '',
    categoryId: initial?.categoryId ?? '',
    subcategory: initial?.subcategory ?? '',
    brand: initial?.brand ?? '',
    unitType: initial?.unitType ?? UnitType.EACH,
    barcodePrimary: initial?.barcodePrimary ?? '',
    barcodeAlternates: (initial?.barcodeAlternates ?? []).join(', '),
    restrictedCategory: initial?.restrictedCategory ?? false,
    restrictedType: initial?.restrictedType ?? RestrictedType.NONE,
    expectedQty: initial?.expectedQty ?? 0,
    reorderLevel: initial?.reorderLevel ?? 0,
    active: initial?.active ?? true,
    imageUrl: initial?.imageUrl ?? '',
  });

  function update(field: string, value: string | number | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'restrictedType') {
        next.restrictedCategory = value !== RestrictedType.NONE;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.sku.trim() || !form.name.trim() || !form.categoryId) {
      setError('SKU, name, and category are required.');
      return;
    }
    try {
      await onSubmit({
        ...form,
        subcategory: form.subcategory || null,
        brand: form.brand || null,
        barcodePrimary: form.barcodePrimary || null,
        barcodeAlternates: form.barcodeAlternates
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        imageUrl: form.imageUrl || null,
        expectedQty: Number(form.expectedQty),
        reorderLevel: Number(form.reorderLevel),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-3xl divide-y divide-gray-100">
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-5 p-6 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="sku">SKU *</label>
          <input id="sku" className="input font-mono" value={form.sku} onChange={(e) => update('sku', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="name">Product name *</label>
          <input id="name" className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="categoryId">Category *</label>
          <select id="categoryId" className="input" value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="subcategory">Subcategory label</label>
          <input id="subcategory" className="input" value={form.subcategory} onChange={(e) => update('subcategory', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="brand">Brand</label>
          <input id="brand" className="input" value={form.brand} onChange={(e) => update('brand', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="unitType">Unit type</label>
          <select id="unitType" className="input" value={form.unitType} onChange={(e) => update('unitType', e.target.value)}>
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="barcodePrimary">Primary barcode</label>
          <input id="barcodePrimary" className="input font-mono" value={form.barcodePrimary} onChange={(e) => update('barcodePrimary', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="barcodeAlternates">Alternate barcodes</label>
          <input id="barcodeAlternates" className="input font-mono" placeholder="comma-separated" value={form.barcodeAlternates} onChange={(e) => update('barcodeAlternates', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="expectedQty">Expected qty</label>
          <input id="expectedQty" type="number" min={0} step="any" className="input" value={form.expectedQty} onChange={(e) => update('expectedQty', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="reorderLevel">Reorder level</label>
          <input id="reorderLevel" type="number" min={0} step="any" className="input" value={form.reorderLevel} onChange={(e) => update('reorderLevel', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="restrictedType">Restricted type</label>
          <select id="restrictedType" className="input" value={form.restrictedType} onChange={(e) => update('restrictedType', e.target.value)}>
            {RESTRICTED_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="imageUrl">Image URL</label>
          <input id="imageUrl" className="input" value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)} />
        </div>
        <div className="flex items-center gap-6 md:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.restrictedCategory} onChange={(e) => update('restrictedCategory', e.target.checked)} />
            Restricted category
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} />
            Active
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 p-6">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial?.id ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
}
