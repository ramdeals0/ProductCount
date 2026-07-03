'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { SessionProgressBar, SessionStatusBadge } from '@/components/sessions/session-badges';
import { EmptyState, PageShell, TableSkeleton } from '@/components/ui/page-shell';
import { useSessions } from '@/hooks/use-api';

export default function SessionsPage() {
  const [status, setStatus] = useState('');
  const [countType, setCountType] = useState('');
  const { data: sessions = [], isLoading } = useSessions({
    status: status || undefined,
    countType: countType || undefined,
  });

  return (
    <>
      <Header title="Count sessions" description="Governance for mobile inventory counts" />
      <PageShell>
        <div className="mb-4 flex flex-wrap gap-3">
          <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In progress</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="posted">Posted</option>
          </select>
          <select className="input max-w-[160px]" value={countType} onChange={(e) => setCountType(e.target.value)}>
            <option value="">All types</option>
            <option value="full">Full</option>
            <option value="cycle">Cycle</option>
            <option value="spot">Spot</option>
          </select>
        </div>

        {isLoading && <TableSkeleton rows={6} cols={5} />}
        {!isLoading && sessions.length === 0 && (
          <EmptyState title="No sessions" description="Count sessions created on mobile will appear here." />
        )}

        {sessions.length > 0 && (
          <div className="card table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Variances</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="font-medium">{s.sessionName}</div>
                      <div className="text-xs text-gray-500">
                        {s.startedAt ? new Date(s.startedAt).toLocaleDateString() : 'Not started'}
                      </div>
                    </td>
                    <td className="capitalize">{s.countType}</td>
                    <td><SessionStatusBadge status={s.status} /></td>
                    <td className="min-w-[140px]"><SessionProgressBar session={s} /></td>
                    <td>
                      {s.varianceCount > 0 ? (
                        <span className="text-amber-700">{s.varianceCount}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/sessions/${s.id}`} className="text-sm font-medium text-brand hover:underline">
                        Open
                      </Link>
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
