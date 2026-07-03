'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isWebAdminRole } from '@shopcount/types';
import type { LoginResponse } from '@shopcount/types';
import { apiRequest } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('manager@desimart.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const staffError = searchParams.get('error') === 'staff';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password, deviceId: 'web-admin' },
      });
      if (!isWebAdminRole(data.user.role)) {
        setError('Staff accounts must use the ShopCount mobile app.');
        return;
      }
      setSession(data.tokens.accessToken, data.tokens.refreshToken, data.user);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            SC
          </div>
          <h1 className="text-xl font-semibold text-gray-900">ShopCount Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in with your owner or manager account</p>
        </div>

        {(error || staffError) && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || 'Staff accounts must use the mobile app.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Demo: owner@desimart.com / manager@desimart.com — password123
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
