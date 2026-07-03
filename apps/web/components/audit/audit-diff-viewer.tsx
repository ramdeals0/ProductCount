'use client';

export function AuditDiffViewer({
  oldValue,
  newValue,
}: {
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}) {
  const keys = new Set([
    ...Object.keys(oldValue ?? {}),
    ...Object.keys(newValue ?? {}),
  ]);

  if (keys.size === 0) {
    return <span className="text-xs text-gray-400">No diff</span>;
  }

  return (
    <div className="space-y-1 text-xs font-mono">
      {Array.from(keys).map((key) => {
        const oldV = oldValue?.[key];
        const newV = newValue?.[key];
        if (JSON.stringify(oldV) === JSON.stringify(newV)) return null;
        return (
          <div key={key} className="rounded bg-gray-50 px-2 py-1">
            <span className="font-semibold text-gray-600">{key}: </span>
            {oldV !== undefined && (
              <span className="text-red-600 line-through">{formatVal(oldV)}</span>
            )}
            {oldV !== undefined && newV !== undefined && <span className="text-gray-400"> → </span>}
            {newV !== undefined && <span className="text-green-700">{formatVal(newV)}</span>}
          </div>
        );
      })}
    </div>
  );
}

function formatVal(v: unknown) {
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
