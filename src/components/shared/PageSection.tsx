import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Standardized content section for prose-heavy pages (Privacy, Terms, etc.)
 */
interface PageSectionProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'prose';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  prose: 'max-w-prose',
};

export const PageSection = ({
  children,
  className,
  maxWidth = '2xl',
}: PageSectionProps) => {
  return (
    <main
      id="main-content"
      className={cn(
        'flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16',
        className,
      )}
    >
      <div className={cn('mx-auto', maxWidthMap[maxWidth])}>
        {children}
      </div>
    </main>
  );
};
