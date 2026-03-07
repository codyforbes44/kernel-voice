import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center';
}

export const SectionHeading = ({
  title,
  subtitle,
  className,
  align = 'center',
}: SectionHeadingProps) => {
  return (
    <motion.div
      className={cn(
        'mb-10 sm:mb-14',
        align === 'center' && 'text-center',
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight mb-3 sm:mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
