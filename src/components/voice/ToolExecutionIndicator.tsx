import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, FileText, BookOpen, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ToolExecution {
  name: string;
  status: 'calling' | 'executing' | 'completed' | 'error';
  startedAt: Date;
}

interface ToolExecutionIndicatorProps {
  toolExecution: ToolExecution | null;
  className?: string;
}

const toolInfo: Record<string, { icon: typeof Search; label: string; color: string }> = {
  search: {
    icon: Search,
    label: 'Searching the web',
    color: 'text-blue-500',
  },
  chat: {
    icon: MessageSquare,
    label: 'Processing with AI',
    color: 'text-purple-500',
  },
  query_document: {
    icon: FileText,
    label: 'Analyzing document',
    color: 'text-amber-500',
  },
  kb_search: {
    icon: BookOpen,
    label: 'Searching knowledge base',
    color: 'text-emerald-500',
  },
};

export function ToolExecutionIndicator({ toolExecution, className }: ToolExecutionIndicatorProps) {
  if (!toolExecution) return null;

  const info = toolInfo[toolExecution.name] || {
    icon: Loader2,
    label: `Running ${toolExecution.name}`,
    color: 'text-primary',
  };

  const Icon = info.icon;
  const isExecuting = toolExecution.status === 'executing' || toolExecution.status === 'calling';
  const isCompleted = toolExecution.status === 'completed';
  const isError = toolExecution.status === 'error';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn('flex justify-center', className)}
      >
        <Badge
          variant="secondary"
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-sm font-medium',
            'bg-background/80 backdrop-blur-sm border shadow-sm',
            isCompleted && 'border-green-500/30 bg-green-500/10',
            isError && 'border-destructive/30 bg-destructive/10'
          )}
        >
          {isExecuting && (
            <Loader2 className={cn('h-4 w-4 animate-spin', info.color)} />
          )}
          {isCompleted && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {isError && (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          
          {!isCompleted && !isError && (
            <Icon className={cn('h-4 w-4', info.color)} />
          )}
          
          <span className={cn(
            isCompleted && 'text-green-600 dark:text-green-400',
            isError && 'text-destructive'
          )}>
            {isCompleted 
              ? 'Done' 
              : isError 
                ? 'Failed' 
                : info.label
            }
          </span>
          
          {isExecuting && (
            <motion.div
              className="flex gap-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1 h-1 rounded-full bg-current opacity-60"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          )}
        </Badge>
      </motion.div>
    </AnimatePresence>
  );
}
