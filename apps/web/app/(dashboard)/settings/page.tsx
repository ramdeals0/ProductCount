'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageShell, TableSkeleton } from '@/components/ui/page-shell';
import { useAuthStore } from '@/stores/auth-store';
import { useStoreMutations, useStoreProfile, useStoreSettings, useUsers } from '@/hooks/use-api';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading: profileLoading } = useStoreProfile();
  const { data: settings, isLoading: settingsLoading } = useStoreSettings();
  const { data: users = [] } = useUsers();
  const { updateProfile, updateSettings, createUser } = useStoreMutations();

  const [profileForm, setProfileForm] = useState({ name: '', address: '', timezone: '' });
  const [settingsForm, setSettingsForm] = useState({
    varianceAutoApprovePercent: 10,
    varianceAutoApprovePercentRestricted: 5,
    varianceAutoApproveQtyRestricted: 2,
    defaultCountType: 'cycle',
    notifyRestrictedVariance: true,
  });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (user && user.role !== 'owner') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: String(profile.name ?? ''),
        address: String(profile.address ?? ''),
        timezone: String(profile.timezone ?? 'America/New_York'),
      });
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        varianceAutoApprovePercent: settings.varianceAutoApprovePercent,
        varianceAutoApprovePercentRestricted: settings.varianceAutoApprovePercentRestricted,
        varianceAutoApproveQtyRestricted: settings.varianceAutoApproveQtyRestricted,
        defaultCountType: settings.defaultCountType,
        notifyRestrictedVariance: settings.notifyRestrictedVariance,
      });
    }
  }, [settings]);

  if (user?.role !== 'owner') return null;

  return (
    <>
      <Header title="Settings" description="Store profile, thresholds, and users" />
      <PageShell>
        {saved && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {saved}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Store profile</h2>
            {profileLoading ? (
              <TableSkeleton rows={3} cols={1} />
            ) : (
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await updateProfile.mutateAsync(profileForm);
                  setSaved('Store profile saved.');
                }}
              >
                <div>
                  <label className="label">Store name</label>
                  <input className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Address</label>
                  <input className="input" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <input className="input" value={profileForm.timezone} onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary" disabled={updateProfile.isPending}>Save profile</button>
              </form>
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Variance thresholds</h2>
            {settingsLoading ? (
              <TableSkeleton rows={4} cols={1} />
            ) : (
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await updateSettings.mutateAsync(settingsForm);
                  setSaved('Thresholds saved.');
                }}
              >
                <div>
                  <label className="label">Auto-approve max variance % (general)</label>
                  <input type="number" className="input" value={settingsForm.varianceAutoApprovePercent} onChange={(e) => setSettingsForm({ ...settingsForm, varianceAutoApprovePercent: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Restricted max variance %</label>
                  <input type="number" className="input" value={settingsForm.varianceAutoApprovePercentRestricted} onChange={(e) => setSettingsForm({ ...settingsForm, varianceAutoApprovePercentRestricted: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Restricted max variance qty</label>
                  <input type="number" className="input" value={settingsForm.varianceAutoApproveQtyRestricted} onChange={(e) => setSettingsForm({ ...settingsForm, varianceAutoApproveQtyRestricted: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Default count type</label>
                  <select className="input" value={settingsForm.defaultCountType} onChange={(e) => setSettingsForm({ ...settingsForm, defaultCountType: e.target.value })}>
                    <option value="full">Full</option>
                    <option value="cycle">Cycle</option>
                    <option value="spot">Spot</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={settingsForm.notifyRestrictedVariance} onChange={(e) => setSettingsForm({ ...settingsForm, notifyRestrictedVariance: e.target.checked })} />
                  Notify on restricted variance
                </label>
                <button type="submit" className="btn-primary" disabled={updateSettings.isPending}>Save thresholds</button>
              </form>
            )}
          </section>

          <section className="card p-6 lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold">Users</h2>
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <input className="input" placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              <input className="input" placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              <input className="input" placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              <select className="input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
              <button
                type="button"
                className="btn-primary md:col-span-4 md:max-w-xs"
                disabled={createUser.isPending}
                onClick={async () => {
                  await createUser.mutateAsync(newUser);
                  setNewUser({ name: '', email: '', password: '', role: 'staff' });
                  setSaved('User invited.');
                }}
              >
                Invite user
              </button>
            </div>
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={String(u.id)}>
                      <td>{String(u.name)}</td>
                      <td>{String(u.email)}</td>
                      <td className="capitalize">{String(u.role)}</td>
                      <td>{u.active ? 'Active' : 'Inactive'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </PageShell>
    </>
  );
}
