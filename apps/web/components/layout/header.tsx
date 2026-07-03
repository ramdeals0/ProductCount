'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function Header({ title, description, actions }: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <header className="flex items-start justify-between border-b border-gray-200 bg-white px-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            clearSession();
            router.replace('/login');
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
