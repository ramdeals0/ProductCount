'use client';

import type { DashboardExtendedStats } from '@shopcount/types';

// Recharts requires client-only rendering
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#635bff', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export function StockByCategoryChart({ data }: { data: DashboardExtendedStats['stockByCategory'] }) {
  if (!data.length) return <ChartEmpty label="No category data" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="categoryName" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="totalUnits" name="Units in stock" fill="#635bff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="lowStockCount" name="Low stock SKUs" fill="#d97706" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VarianceByCategoryChart({ data }: { data: DashboardExtendedStats['varianceByCategory'] }) {
  if (!data.length) return <ChartEmpty label="No variance data yet" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="categoryName" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="shortageUnits" name="Shortages" fill="#dc2626" stackId="a" />
        <Bar dataKey="overageUnits" name="Overages" fill="#16a34a" stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SessionsByStatusChart({ data }: { data: DashboardExtendedStats['sessionsByStatus'] }) {
  const filtered = data.filter((d) => d.count > 0);
  if (!filtered.length) return <ChartEmpty label="No sessions yet" />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={filtered} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
          {filtered.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ShrinkByReasonChart({ data }: { data: DashboardExtendedStats['shrinkByReason'] }) {
  if (!data.length) return <ChartEmpty label="No shrink reason data" />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="reasonCode" width={120} tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="totalVarianceQty" name="Net variance qty" fill="#7c3aed" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-gray-400">{label}</div>
  );
}
