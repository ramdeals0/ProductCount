'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { EmptyState, PageShell, TableSkeleton } from '@/components/ui/page-shell';
import { useCategories, useCategoryMutations } from '@/hooks/use-api';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const { create, update, remove } = useCategoryMutations();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', restrictedCategory: false, parentId: '' });
  const [editId, setEditId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      restrictedCategory: form.restrictedCategory,
      parentId: form.parentId || null,
    };
    if (editId) {
      await update.mutateAsync({ id: editId, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    setShowForm(false);
    setEditId(null);
    setForm({ name: '', slug: '', restrictedCategory: false, parentId: '' });
  }

  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <>
      <Header
        title="Categories"
        description="Organize products into categories and subcategories"
        actions={
          <button type="button" className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); }}>
            Add category
          </button>
        }
      />
      <PageShell>
        {showForm && (
          <form onSubmit={handleSubmit} className="card mb-6 grid gap-4 p-6 md:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} required />
            </div>
            <div>
              <label className="label">Slug</label>
              <input className="input font-mono text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div>
              <label className="label">Parent category</label>
              <select className="input" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">None (top-level)</option>
                {parentCategories.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.restrictedCategory} onChange={(e) => setForm({ ...form, restrictedCategory: e.target.checked })} />
                Restricted category
              </label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="btn-primary">{editId ? 'Save' : 'Create'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        {isLoading && <TableSkeleton rows={6} cols={4} />}
        {!isLoading && categories.length === 0 && (
          <EmptyState title="No categories" description="Create categories to organize your product catalog." />
        )}

        {categories.length > 0 && (
          <div className="card table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Parent</th>
                  <th>Restricted</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const parent = categories.find((p) => p.id === c.parentId);
                  return (
                    <tr key={String(c.id)}>
                      <td className="font-medium">{String(c.name)}</td>
                      <td className="font-mono text-xs text-gray-500">{String(c.slug)}</td>
                      <td className="text-gray-600">{parent ? String(parent.name) : '—'}</td>
                      <td>
                        {c.restrictedCategory ? (
                          <span className="badge bg-restricted-soft text-restricted">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="space-x-2 text-right">
                        <button
                          type="button"
                          className="text-sm text-brand hover:underline"
                          onClick={() => {
                            setEditId(String(c.id));
                            setForm({
                              name: String(c.name),
                              slug: String(c.slug),
                              restrictedCategory: Boolean(c.restrictedCategory),
                              parentId: c.parentId ? String(c.parentId) : '',
                            });
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:underline"
                          onClick={() => remove.mutate(String(c.id))}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
    </>
  );
}
