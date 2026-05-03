import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  /** Render as h1 (default) or h2 for nested contexts. */
  as?: 'h1' | 'h2';
}

/**
 * Standardized page header used across authenticated and admin pages.
 * Stacks vertically on mobile, splits actions to the right on sm+.
 */
export const PageHeader = ({ title, description, actions, className, as: Tag = 'h1' }: PageHeaderProps) => (
  <header
    className={cn(
      'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 sm:mb-6',
      className,
    )}
  >
    <div className="min-w-0">
      <Tag className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{title}</Tag>
      {description && (
        <p className="mt-1 text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </header>
);
