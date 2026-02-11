import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

export function CharacterSelectCard() {
  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-zinc-100">Character</h3>
      <Select defaultValue="rachel">
        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          <SelectItem value="rachel" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">Rachel</SelectItem>
          <SelectItem value="drew" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">Drew</SelectItem>
          <SelectItem value="clyde" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">Clyde</SelectItem>
          <SelectItem value="aria" className="text-zinc-200 focus:bg-zinc-700 focus:text-white">Aria</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
