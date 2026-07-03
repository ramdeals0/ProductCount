'use client';

import { Header } from '@/components/layout/header';
import { PageShell } from '@/components/ui/page-shell';

export default function SessionsPage() {
  return (
    <>
      <Header title="Count sessions" description="Session governance — coming in Phase 3" />
      <PageShell>
        <div className="card p-8 text-sm text-gray-500">
          Session list, detail views, and variance review will be implemented in Phase 3.
        </div>
      </PageShell>
    </>
  );
}
