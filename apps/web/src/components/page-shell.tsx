import type { ReactNode } from 'react';

export function PageShell({
  title,
  description,
  badge,
  action,
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:px-8 bg-white text-black">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b-2 border-black">
        <div>
          {badge && (
            <span className="inline-block rounded border border-black bg-white px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-black mb-2.5">
              {badge}
            </span>
          )}
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-black uppercase">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-xs md:text-sm font-medium leading-relaxed text-neutral-600">
            {description}
          </p>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Main Content Area */}
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
