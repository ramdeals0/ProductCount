'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { EmptyState, PageShell, TableSkeleton } from '@/components/ui/page-shell';
import { useLocationMutations, useLocations } from '@/hooks/use-api';

export default function LocationsPage() {
  const { data: locations = [], isLoading } = useLocations();
  const { create, update, remove } = useLocationMutations();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', active: true });
  const [editId, setEditId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      code: form.code.toUpperCase(),
      description: form.description || null,
      active: form.active,
    };
    if (editId) {
      await update.mutateAsync({ id: editId, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    setShowForm(false);
    setEditId(null);
    setForm({ name: '', code: '', description: '', active: true });
  }

  return (
    <>
      <Header
        title="Locations"
        description="Store bins and count zones for mobile sessions"
        actions={
          <button type="button" className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); }}>
            Add location
          </button>
        }
      />
      <PageShell>
        {showForm && (
          <form onSubmit={handleSubmit} className="card mb-6 grid gap-4 p-6 md:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Code</label>
              <input className="input font-mono uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <label htmlFor="active" className="text-sm">Active</label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="btn-primary">{editId ? 'Save' : 'Create'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        {isLoading && <TableSkeleton rows={6} cols={4} />}
        {!isLoading && locations.length === 0 && (
          <EmptyState title="No locations" description="Add store locations for count sessions." />
        )}

        {locations.length > 0 && (
          <div className="card table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {locations.map((l) => (
                  <tr key={String(l.id)}>
                    <td className="font-medium">{String(l.name)}</td>
                    <td className="font-mono text-xs">{String(l.code)}</td>
                    <td className="text-gray-600">{String(l.description ?? '—')}</td>
                    <td>
                      {l.active ? (
                        <span className="badge bg-green-100 text-green-700">Active</span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-600">Inactive</span>
                      )}
                    </td>
                    <td className="space-x-2 text-right">
                      <button
                        type="button"
                        className="text-sm text-brand hover:underline"
                        onClick={() => {
                          setEditId(String(l.id));
                          setForm({
                            name: String(l.name),
                            code: String(l.code),
                            description: String(l.description ?? ''),
                            active: Boolean(l.active),
                          });
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => remove.mutate(String(l.id))}
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
    </>
  );
}
