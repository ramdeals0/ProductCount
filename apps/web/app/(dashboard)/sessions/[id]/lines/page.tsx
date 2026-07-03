'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { VarianceBadge } from '@/components/sessions/session-badges';
import { EmptyState, PageShell, TableSkeleton } from '@/components/ui/page-shell';
import { useSession, useSessionLines, useSessionMutations } from '@/hooks/use-api';

export default function SessionLinesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data: session } = useSession(id);
  const { data: lines = [], isLoading } = useSessionLines(id, filter === 'all' ? undefined : filter);
  const { approveLine, recountLine, bulkApprove, bulkRecount } = useSessionMutations(id);

  function toggleSelect(lineId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  }

  return (
    <>
      <Header
        title="Variance review"
        description={session?.sessionName ?? ''}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={bulkApprove.isPending}
              onClick={() => bulkApprove.mutate({ excludeRestricted: true, maxVariancePercent: 5, maxVarianceQty: 2 })}
            >
              Approve low variance
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={selected.size === 0 || bulkRecount.isPending}
              onClick={() => bulkRecount.mutate({ lineIds: Array.from(selected), notes: 'Recount requested' })}
            >
              Recount selected ({selected.size})
            </button>
            <Link href={`/sessions/${id}`} className="btn-secondary">Back to session</Link>
          </div>
        }
      />
      <PageShell>
        <div className="mb-4 flex flex-wrap gap-2">
          {['all', 'matched', 'shortage', 'overage', 'restricted', 'needs_approval', 'uncounted'].map((f) => (
            <button
              key={f}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                filter === f ? 'bg-brand text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'
              }`}
              onClick={() => setFilter(f)}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {isLoading && <TableSkeleton rows={8} cols={7} />}
        {!isLoading && lines.length === 0 && (
          <EmptyState title="No lines match filter" description="Try a different variance filter." />
        )}

        {lines.length > 0 && (
          <div className="card table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th />
                  <th>Product</th>
                  <th>Location</th>
                  <th>Expected</th>
                  <th>Counted</th>
                  <th>Variance</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className={line.restrictedCategory ? 'bg-restricted-soft/20' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(line.id)}
                        onChange={() => toggleSelect(line.id)}
                      />
                    </td>
                    <td>
                      <div className="font-medium">{line.product?.name ?? line.productId}</div>
                      <div className="font-mono text-xs text-gray-500">{line.product?.sku}</div>
                      {line.restrictedCategory && (
                        <span className="badge mt-1 bg-restricted-soft text-restricted">Restricted</span>
                      )}
                    </td>
                    <td className="text-sm text-gray-600">{line.location?.name ?? '—'}</td>
                    <td>{line.expectedQty}</td>
                    <td>{line.countedQty ?? '—'}</td>
                    <td><VarianceBadge varianceQty={line.varianceQty} /></td>
                    <td className="text-xs text-gray-500">{line.reasonCode ?? '—'}</td>
                    <td>
                      {line.approved ? (
                        <span className="badge bg-green-100 text-green-700">Approved</span>
                      ) : line.requiresApproval ? (
                        <span className="badge bg-amber-100 text-amber-800">Needs approval</span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-600">OK</span>
                      )}
                    </td>
                    <td className="space-x-2 whitespace-nowrap text-right">
                      {!line.approved && (
                        <button
                          type="button"
                          className="text-xs font-medium text-brand hover:underline"
                          onClick={() => approveLine.mutate({ lineId: line.id })}
                        >
                          Approve
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-xs font-medium text-amber-700 hover:underline"
                        onClick={() => recountLine.mutate({ lineId: line.id })}
                      >
                        Recount
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
