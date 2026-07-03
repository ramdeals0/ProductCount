import type { CountSessionWithProgress } from '@shopcount/types';

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-700',
  posted: 'bg-indigo-100 text-indigo-700',
};

export function SessionStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge capitalize ${STATUS_STYLE[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function SessionProgressBar({ session }: { session: CountSessionWithProgress }) {
  const pct = session.completionPercent ?? 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-500">
        <span>{session.countedLines}/{session.totalLines} lines</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function VarianceBadge({ varianceQty }: { varianceQty: number | null }) {
  if (varianceQty === null) return <span className="badge bg-gray-100 text-gray-500">Uncounted</span>;
  if (varianceQty === 0) return <span className="badge bg-green-100 text-green-700">Matched</span>;
  if (varianceQty < 0) return <span className="badge bg-red-100 text-red-700">Shortage {varianceQty}</span>;
  return <span className="badge bg-amber-100 text-amber-800">Overage +{varianceQty}</span>;
}
