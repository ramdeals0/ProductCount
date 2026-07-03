'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { AuditDiffViewer } from '@/components/audit/audit-diff-viewer';
import { EmptyState, PageShell, TableSkeleton } from '@/components/ui/page-shell';
import { useAuditEvents } from '@/hooks/use-api';

export default function AuditPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const { data, isLoading } = useAuditEvents({
    entityType: entityType || undefined,
    action: action || undefined,
    q: q || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
    limit,
    offset,
  });

  return (
    <>
      <Header title="Audit logs" description="Immutable activity trail from mobile and admin" />
      <PageShell>
        <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input className="input" placeholder="Search SKU, session, action…" value={q} onChange={(e) => { setQ(e.target.value); setOffset(0); }} />
          <select className="input" value={entityType} onChange={(e) => { setEntityType(e.target.value); setOffset(0); }}>
            <option value="">All entities</option>
            <option value="product">Product</option>
            <option value="count_session">Session</option>
            <option value="count_line">Count line</option>
            <option value="user">User</option>
            <option value="sync">Sync</option>
          </select>
          <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        {isLoading && <TableSkeleton rows={8} cols={5} />}
        {!isLoading && data?.items.length === 0 && (
          <EmptyState title="No audit events" description="Activity will appear as users count and manage inventory." />
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="card table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((event) => (
                    <tr key={event.id}>
                      <td className="whitespace-nowrap text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                        {event.offline && <span className="ml-1 text-amber-600">offline</span>}
                      </td>
                      <td className="text-sm">{event.userName ?? event.userId.slice(0, 8)}</td>
                      <td className="text-sm capitalize">{event.action.replace(/_/g, ' ')}</td>
                      <td className="text-xs">
                        <span className="text-gray-500">{event.entityType}</span>
                        <div className="font-mono">{event.entityId.slice(0, 12)}…</div>
                      </td>
                      <td className="max-w-md">
                        <AuditDiffViewer oldValue={event.oldValue as Record<string, unknown>} newValue={event.newValue as Record<string, unknown>} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-500">
              <span>{data.total} events</span>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</button>
                <button type="button" className="btn-secondary" disabled={offset + limit >= data.total} onClick={() => setOffset(offset + limit)}>Next</button>
              </div>
            </div>
          </>
        )}
      </PageShell>
    </>
  );
}
