'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isWebAdminRole } from '@shopcount/types';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (!isWebAdminRole(user.role)) {
      router.replace('/login?error=staff');
    }
  }, [hydrated, token, user, router]);

  if (!hydrated || !token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted">
        <div className="text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
