'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { SessionProgressBar, SessionStatusBadge } from '@/components/sessions/session-badges';
import { PageShell, TableSkeleton } from '@/components/ui/page-shell';
import { useSession, useSessionMutations } from '@/hooks/use-api';

const STATUS_FLOW = ['draft', 'in_progress', 'review', 'approved', 'posted'] as const;

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, isLoading } = useSession(id);
  const { updateStatus, approveSession } = useSessionMutations(id);
  const [notes, setNotes] = useState('');

  function nextStatus(current: string) {
    const idx = STATUS_FLOW.indexOf(current as typeof STATUS_FLOW[number]);
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  }

  return (
    <>
      <Header
        title={session?.sessionName ?? 'Session'}
        description="Session detail and governance"
        actions={
          session && (
            <div className="flex gap-2">
              <Link href={`/sessions/${id}/lines`} className="btn-primary">
                Review variances
              </Link>
              {session.status === 'review' && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={approveSession.isPending}
                  onClick={() => approveSession.mutate(notes || undefined)}
                >
                  Approve session
                </button>
              )}
              {nextStatus(session.status) && session.status !== 'review' && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ status: nextStatus(session.status)!, notes })}
                >
                  Move to {nextStatus(session.status)!.replace('_', ' ')}
                </button>
              )}
            </div>
          )
        }
      />
      <PageShell>
        {isLoading || !session ? (
          <TableSkeleton rows={4} cols={2} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <div className="mb-4 flex items-center gap-3">
                <SessionStatusBadge status={session.status} />
                <span className="capitalize text-sm text-gray-500">{session.countType} count</span>
              </div>
              <SessionProgressBar session={session} />
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Lines counted</dt>
                  <dd>{session.countedLines} / {session.totalLines}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Variances</dt>
                  <dd>{session.varianceCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Started</dt>
                  <dd>{session.startedAt ? new Date(session.startedAt).toLocaleString() : '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Submitted</dt>
                  <dd>{session.submittedAt ? new Date(session.submittedAt).toLocaleString() : '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Approved</dt>
                  <dd>{session.approvedAt ? new Date(session.approvedAt).toLocaleString() : '—'}</dd>
                </div>
              </dl>
            </div>

            <div className="card p-6">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Notes</h2>
              <textarea
                className="input min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={session.notes ?? 'Add manager notes…'}
              />
              {session.notes && (
                <p className="mt-3 text-sm text-gray-500">Existing: {session.notes}</p>
              )}
              <div className="mt-6">
                <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Status history</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>Created · {new Date(session.createdAt).toLocaleString()}</li>
                  {session.startedAt && <li>Started · {new Date(session.startedAt).toLocaleString()}</li>}
                  {session.submittedAt && <li>Submitted for review · {new Date(session.submittedAt).toLocaleString()}</li>}
                  {session.approvedAt && <li>Approved · {new Date(session.approvedAt).toLocaleString()}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </>
  );
}
