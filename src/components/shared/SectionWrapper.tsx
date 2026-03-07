import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Adds the muted/30 background band */
  muted?: boolean;
  /** Adds radial glow background */
  glow?: 'top' | 'center' | 'bottom';
  /** Padding variant */
  size?: 'sm' | 'md' | 'lg';
}

const paddingMap = {
  sm: 'py-10 sm:py-14 md:py-20',
  md: 'py-12 sm:py-20 md:py-28',
  lg: 'py-16 sm:py-24 md:py-32',
};

const glowMap = {
  top: 'bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]',
  center: 'bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_70%)]',
  bottom: 'bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.1),transparent_50%)]',
};

export const SectionWrapper = ({
  children,
  className,
  id,
  muted = false,
  glow,
  size = 'md',
}: SectionWrapperProps) => {
  return (
    <section
      id={id}
      className={cn(
        'relative overflow-hidden',
        paddingMap[size],
        muted && 'bg-muted/30',
        className,
      )}
    >
      {glow && <div className={cn('absolute inset-0', glowMap[glow])} />}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {children}
      </div>
    </section>
  );
};
