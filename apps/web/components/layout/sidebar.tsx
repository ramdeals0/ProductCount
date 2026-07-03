'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/products', label: 'Products', icon: '📦' },
  { href: '/categories', label: 'Categories', icon: '🏷️' },
  { href: '/locations', label: 'Locations', icon: '📍' },
  { href: '/sessions', label: 'Sessions', icon: '📋' },
  { href: '/audit', label: 'Audit Logs', icon: '🔍' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            SC
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">ShopCount Admin</div>
            <div className="text-xs text-gray-500">Inventory operations</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const hidden = item.href === '/settings' && user?.role !== 'owner';
          if (hidden) return null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-brand/10 text-brand'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-900">{user.name}</div>
          <div className="text-xs capitalize text-gray-500">{user.role}</div>
        </div>
      )}
    </aside>
  );
}
