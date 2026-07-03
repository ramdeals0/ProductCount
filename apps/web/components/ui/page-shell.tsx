export function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-auto p-8">{children}</div>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="text-4xl opacity-40">📭</div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="animate-pulse">
        <div className="h-10 bg-gray-100" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 border-t border-gray-100 px-4 py-4">
            {Array.from({ length: cols }).map((__, j) => (
              <div key={j} className="h-4 flex-1 rounded bg-gray-100" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
