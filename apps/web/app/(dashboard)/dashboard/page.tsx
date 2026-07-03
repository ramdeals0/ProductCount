'use client';

import { Header } from '@/components/layout/header';
import { PageShell } from '@/components/ui/page-shell';
import { TableSkeleton } from '@/components/ui/page-shell';
import { useDashboard } from '@/hooks/use-api';

function MetricCard({ label, value, tone }: { label: string; value: number; tone?: 'warning' | 'danger' }) {
  const toneClass =
    tone === 'warning' ? 'text-amber-600' : tone === 'danger' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  return (
    <>
      <Header title="Dashboard" description="Store inventory overview" />
      <PageShell>
        {isLoading || !data ? (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <TableSkeleton key={i} rows={1} cols={1} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <MetricCard label="Active sessions" value={data.activeSessions} />
            <MetricCard label="Pending review" value={data.pendingReview} tone="warning" />
            <MetricCard label="Restricted variances" value={data.restrictedVariances} tone="danger" />
            <MetricCard label="Low stock items" value={data.lowStockItems} tone="warning" />
            <MetricCard label="Sync issues" value={data.syncIssues} tone="danger" />
          </div>
        )}

        <div className="mt-8 card p-6">
          <h2 className="text-lg font-semibold text-gray-900">Quick links</h2>
          <p className="mt-2 text-sm text-gray-500">
            Manage your product catalog, review count sessions, and monitor variances from the sidebar.
            Charts and extended reports arrive in Phase 3.
          </p>
        </div>
      </PageShell>
    </>
  );
}
