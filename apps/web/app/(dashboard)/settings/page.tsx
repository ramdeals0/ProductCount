'use client';

import { Header } from '@/components/layout/header';
import { PageShell } from '@/components/ui/page-shell';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'owner') router.replace('/dashboard');
  }, [user, router]);

  return (
    <>
      <Header title="Settings" description="Store configuration — coming in Phase 4" />
      <PageShell>
        <div className="card p-8 text-sm text-gray-500">
          Variance thresholds, user management, and store profile settings arrive in Phase 4.
        </div>
      </PageShell>
    </>
  );
}
