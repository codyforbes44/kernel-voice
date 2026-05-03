import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Trash2, Download, Shield, X } from 'lucide-react';

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  onBulkRoleChange?: (role: 'admin' | 'moderator' | 'user') => void;
  showRoleActions?: boolean;
  resourceType?: 'user' | 'conversation' | 'document';
}

export const BulkActionToolbar = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onBulkRoleChange,
  showRoleActions = false,
  resourceType = 'user',
}: BulkActionToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="
        fixed sm:static inset-x-0 bottom-0 sm:inset-auto z-40
        flex flex-wrap items-center gap-2 sm:gap-3
        p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3
        bg-primary/5 border-t sm:border border-primary/20 sm:rounded-lg
        backdrop-blur supports-[backdrop-filter]:bg-primary/10
      "
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium truncate">
          {selectedCount} {resourceType}
          {selectedCount > 1 ? 's' : ''} selected
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="flex-1 min-w-[1rem]" />

      <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
        {onBulkExport && (
          <Button variant="outline" size="sm" onClick={onBulkExport} className="min-h-[40px]">
            <Download className="h-4 w-4 mr-2" aria-hidden />
            Export
          </Button>
        )}

        {showRoleActions && onBulkRoleChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-h-[40px]">
                <Shield className="h-4 w-4 mr-2" aria-hidden />
                Change Role
                <ChevronDown className="h-4 w-4 ml-2" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBulkRoleChange('user')}>Set as User</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkRoleChange('moderator')}>Set as Moderator</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkRoleChange('admin')}>Set as Admin</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onBulkDelete && (
          <Button variant="destructive" size="sm" onClick={onBulkDelete} className="min-h-[40px]">
            <Trash2 className="h-4 w-4 mr-2" aria-hidden />
            Delete Selected
          </Button>
        )}
      </div>
    </div>
  );
};
