import { Skeleton } from './skeleton';

interface SkeletonListProps {
  count?: number;
  className?: string;
  variant?: 'card' | 'message' | 'conversation';
}

export const SkeletonList = ({ 
  count = 3, 
  className = '',
  variant = 'card' 
}: SkeletonListProps) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'conversation') {
    return (
      <div className={`space-y-2 ${className}`}>
        {items.map((i) => (
          <div key={i} className="p-2 rounded-lg">
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'message') {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((i) => (
          <div 
            key={i} 
            className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
              <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-32' : 'w-48'} rounded-lg`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((i) => (
        <div key={i} className="p-4 rounded-lg border border-border">
          <Skeleton className="h-5 w-1/2 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
};
