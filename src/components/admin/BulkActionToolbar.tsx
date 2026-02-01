import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  Trash2, 
  Download, 
  Shield, 
  X 
} from 'lucide-react';

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
    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} {resourceType}{selectedCount > 1 ? 's' : ''} selected
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {onBulkExport && (
          <Button variant="outline" size="sm" onClick={onBulkExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}

        {showRoleActions && onBulkRoleChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Change Role
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBulkRoleChange('user')}>
                Set as User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkRoleChange('moderator')}>
                Set as Moderator
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkRoleChange('admin')}>
                Set as Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onBulkDelete && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        )}
      </div>
    </div>
  );
};