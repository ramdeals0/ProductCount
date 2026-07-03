'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/header';
import {
  SessionsByStatusChart,
  ShrinkByReasonChart,
  StockByCategoryChart,
  VarianceByCategoryChart,
} from '@/components/dashboard/charts';
import { PageShell, TableSkeleton } from '@/components/ui/page-shell';
import { useExtendedDashboard } from '@/hooks/use-api';

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
  const { data, isLoading } = useExtendedDashboard();

  return (
    <>
      <Header title="Dashboard" description="Store inventory overview" />
      <PageShell>
        {isLoading || !data ? (
          <TableSkeleton rows={4} cols={4} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              <MetricCard label="Active sessions" value={data.activeSessions} />
              <MetricCard label="Pending review" value={data.pendingReview} tone="warning" />
              <MetricCard label="Restricted variances" value={data.restrictedVariances} tone="danger" />
              <MetricCard label="Low stock items" value={data.lowStockItems} tone="warning" />
              <MetricCard label="Sync issues" value={data.syncIssues} tone="danger" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">Stock by category</h2>
                <StockByCategoryChart data={data.stockByCategory} />
              </div>
              <div className="card p-5">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">Variance by category</h2>
                <VarianceByCategoryChart data={data.varianceByCategory} />
              </div>
              <div className="card p-5">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">Sessions by status</h2>
                <SessionsByStatusChart data={data.sessionsByStatus} />
              </div>
              <div className="card p-5">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">Shrink by reason code</h2>
                <ShrinkByReasonChart data={data.shrinkByReason} />
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="card p-5 lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">Top low-stock items</h2>
                {data.lowStockTop10.length === 0 ? (
                  <p className="text-sm text-gray-400">All items above reorder level</p>
                ) : (
                  <div className="table-shell">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Expected</th>
                          <th>Reorder</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lowStockTop10.map((p) => (
                          <tr key={p.productId}>
                            <td>{p.name}</td>
                            <td className="font-mono text-xs">{p.sku}</td>
                            <td className="text-amber-700">{p.expectedQty}</td>
                            <td>{p.reorderLevel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="card p-5">
                  <h2 className="mb-3 text-sm font-semibold text-gray-900">Restricted overview</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Alcohol SKUs</span>
                      <span className="font-medium">{data.restrictedOverview.alcoholCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tobacco SKUs</span>
                      <span className="font-medium">{data.restrictedOverview.tobaccoCount}</span>
                    </div>
                  </div>
                  {data.restrictedOverview.recentHighVariance.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="mb-2 text-xs font-semibold uppercase text-gray-400">High variance</div>
                      <ul className="space-y-2 text-sm">
                        {data.restrictedOverview.recentHighVariance.map((r) => (
                          <li key={`${r.sessionId}-${r.productId}`}>
                            <div className="font-medium">{r.productName}</div>
                            <div className="text-xs text-red-600">
                              {r.varianceQty} units · {r.sessionName}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="card p-5">
                  <h2 className="mb-3 text-sm font-semibold text-gray-900">System health</h2>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Last sync</dt>
                      <dd>{data.systemHealth.lastSyncAt ? new Date(data.systemHealth.lastSyncAt).toLocaleString() : '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Pending events</dt>
                      <dd>{data.systemHealth.pendingSyncEvents}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Failed events</dt>
                      <dd className={data.systemHealth.failedSyncEvents > 0 ? 'text-red-600' : ''}>
                        {data.systemHealth.failedSyncEvents}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Active devices</dt>
                      <dd>{data.systemHealth.activeDevices}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="mt-6 card p-4 text-sm">
              <Link href="/sessions" className="font-medium text-brand hover:underline">
                Review count sessions →
              </Link>
            </div>
          </>
        )}
      </PageShell>
    </>
  );
}
