'use client';

import Link from 'next/link';
import type { Product } from '@shopcount/types';

export function ProductTable({
  products,
  categories,
  onToggleActive,
  onToggleRestricted,
  onQuickEdit,
}: {
  products: Product[];
  categories: Array<{ id: string; name: string }>;
  onToggleActive: (id: string, active: boolean) => void;
  onToggleRestricted: (id: string, restricted: boolean) => void;
  onQuickEdit: (id: string, field: 'expectedQty' | 'reorderLevel', value: number) => void;
}) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="card table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Expected</th>
            <th>Reorder</th>
            <th>Restricted</th>
            <th>Active</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const lowStock = p.expectedQty <= p.reorderLevel;
            return (
              <tr key={p.id}>
                <td>
                  <div className="font-medium text-gray-900">{p.name}</div>
                  {p.brand && <div className="text-xs text-gray-500">{p.brand}</div>}
                </td>
                <td className="font-mono text-xs text-gray-600">{p.sku}</td>
                <td className="text-gray-600">{catMap.get(p.categoryId) ?? '—'}</td>
                <td>
                  <input
                    type="number"
                    className="input w-20 py-1 text-xs"
                    defaultValue={p.expectedQty}
                    onBlur={(e) => onQuickEdit(p.id, 'expectedQty', Number(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input w-20 py-1 text-xs"
                    defaultValue={p.reorderLevel}
                    onBlur={(e) => onQuickEdit(p.id, 'reorderLevel', Number(e.target.value))}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className={`badge ${p.restrictedCategory ? 'bg-restricted-soft text-restricted' : 'bg-gray-100 text-gray-600'}`}
                    onClick={() => onToggleRestricted(p.id, !p.restrictedCategory)}
                  >
                    {p.restrictedType !== 'none' ? p.restrictedType : 'none'}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.active}
                    className={`relative h-6 w-11 rounded-full transition ${p.active ? 'bg-brand' : 'bg-gray-300'}`}
                    onClick={() => onToggleActive(p.id, !p.active)}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${p.active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </td>
                <td>
                  {!p.active ? (
                    <span className="badge bg-gray-100 text-gray-600">Inactive</span>
                  ) : lowStock ? (
                    <span className="badge bg-amber-100 text-amber-700">Low stock</span>
                  ) : (
                    <span className="badge bg-green-100 text-green-700">OK</span>
                  )}
                </td>
                <td>
                  <Link href={`/products/${p.id}`} className="text-sm font-medium text-brand hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
