import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';

interface SavePresetDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; isShared: boolean }) => Promise<void>;
  systemPrompt: string;
  firstMessage?: string;
  isLoading?: boolean;
}

export function SavePresetDialog({
  open,
  onClose,
  onSave,
  systemPrompt,
  firstMessage,
  isLoading = false,
}: SavePresetDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isShared, setIsShared] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    await onSave({ name: name.trim(), description: description.trim(), isShared });
    
    // Reset form
    setName('');
    setDescription('');
    setIsShared(false);
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setIsShared(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save as Preset
          </DialogTitle>
          <DialogDescription>
            Save your current system prompt configuration as a reusable preset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name *</Label>
            <Input
              id="preset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., E-commerce Support Agent"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-description">Description</Label>
            <Textarea
              id="preset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this preset's purpose..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Preview</Label>
            <div className="p-3 bg-muted rounded-md max-h-24 overflow-y-auto">
              <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {systemPrompt.slice(0, 200)}{systemPrompt.length > 200 ? '...' : ''}
              </p>
            </div>
            {firstMessage && (
              <p className="text-xs text-muted-foreground">
                First message: "{firstMessage.slice(0, 50)}{firstMessage.length > 50 ? '...' : ''}"
              </p>
            )}
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
            <div className="space-y-0.5">
              <Label htmlFor="share-preset" className="text-sm font-medium">
                Share with team
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow other users to use this preset
              </p>
            </div>
            <Switch
              id="share-preset"
              checked={isShared}
              onCheckedChange={setIsShared}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
