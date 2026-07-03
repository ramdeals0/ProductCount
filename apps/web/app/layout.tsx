import type { Metadata } from 'next';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShopCount Admin',
  description: 'Inventory master data and operations dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
