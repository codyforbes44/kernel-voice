import { useState, useEffect, useCallback } from 'react';
import { Mic } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MicSelectorProps {
  onDeviceChange?: (deviceId: string) => void;
  disabled?: boolean;
  className?: string;
}

const STORAGE_KEY = 'preferred_mic_device_id';

export function MicSelector({ onDeviceChange, disabled, className }: MicSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEY) || 'default'
  );

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const mics = all.filter((d) => d.kind === 'audioinput');
      setDevices(mics);
    } catch {
      setDevices([]);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  const handleChange = (id: string) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
    onDeviceChange?.(id);
  };

  if (devices.length <= 1) return null;

  return (
    <div className={className}>
      <Select value={selectedId} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className="w-full h-9 text-xs">
          <div className="flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Select microphone" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">System Default</SelectItem>
          {devices.map((d) => (
            <SelectItem key={d.deviceId} value={d.deviceId}>
              {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
