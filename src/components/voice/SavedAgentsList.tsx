import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MoreVertical, Pencil, Copy, Trash2, Bot } from 'lucide-react';
import { type SavedAgent } from '@/hooks/useSavedAgents';
import { providerInfo } from './voiceTypes';
import type { VoiceProvider } from './voiceTypes';

interface SavedAgentsListProps {
  agents: SavedAgent[];
  isLoading: boolean;
  activeAgentId?: string | null;
  onLoadAgent: (agent: SavedAgent) => void;
  onEditAgent: (agent: SavedAgent) => void;
  onDuplicateAgent: (agent: SavedAgent) => void;
  onDeleteAgent: (id: string) => void;
}

export function SavedAgentsList({
  agents, isLoading, activeAgentId, onLoadAgent, onEditAgent, onDuplicateAgent, onDeleteAgent,
}: SavedAgentsListProps) {
  if (isLoading || agents.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">My Agents</span>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {agents.map((agent) => {
            const info = providerInfo[agent.voice_provider as VoiceProvider];
            const isActive = activeAgentId === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => onLoadAgent(agent)}
                className={`group relative flex-shrink-0 cursor-pointer rounded-xl border p-3 min-w-[140px] max-w-[180px] transition-all hover:shadow-md ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{agent.icon}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 min-h-[36px] min-w-[36px] opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Options for ${agent.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditAgent(agent); }} className="min-h-[44px]">
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicateAgent(agent); }} className="min-h-[44px]">
                        <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive min-h-[44px]"
                        onClick={(e) => { e.stopPropagation(); onDeleteAgent(agent.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm font-medium truncate mt-1">{agent.name}</p>
                {info && (
                  <Badge variant="secondary" className="text-[10px] mt-1 px-1.5 py-0">
                    {info.name}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
