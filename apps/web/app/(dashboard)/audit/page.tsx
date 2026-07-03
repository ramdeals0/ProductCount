'use client';

import { Header } from '@/components/layout/header';
import { PageShell } from '@/components/ui/page-shell';

export default function AuditPage() {
  return (
    <>
      <Header title="Audit logs" description="Activity trail — coming in Phase 3" />
      <PageShell>
        <div className="card p-8 text-sm text-gray-500">
          Audit log viewer with filters and diffs will be implemented in Phase 3.
        </div>
      </PageShell>
    </>
  );
}
