import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 'h-6 w-6 sm:h-7 sm:w-7',
  md: 'h-8 w-8',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
} as const;

interface BrandLogoProps {
  size?: keyof typeof sizeMap;
  animate?: boolean;
  className?: string;
}

export const BrandLogo = ({ size = 'md', animate = true, className }: BrandLogoProps) => {
  return (
    <div className={cn('relative rounded-xl overflow-hidden', sizeMap[size], className)}>
      {/* Rotating conic gradient */}
      <div
        className={cn('absolute inset-0 rounded-xl', animate && 'animate-logo-spin')}
        style={{
          background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--gold)), hsl(var(--primary)))',
          willChange: animate ? 'transform' : undefined,
        }}
      />
      {/* Inner background inset (creates border effect) */}
      <div className="absolute inset-[1px] rounded-[10px] bg-background" />
    </div>
  );
};
