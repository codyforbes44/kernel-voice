import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sun, Moon, Check, Mic, MessageSquare, FileSearch } from 'lucide-react';

interface ThemeCardProps {
  theme: 'light' | 'dark';
  isSelected: boolean;
  onSelect: () => void;
}

const ThemeCard = ({ theme, isSelected, onSelect }: ThemeCardProps) => {
  const isDark = theme === 'dark';
  
  return (
    <button
      onClick={onSelect}
      className={`relative w-full rounded-xl border-2 p-1 transition-all duration-200 hover:scale-[1.02] ${
        isSelected 
          ? 'border-primary ring-2 ring-primary/20' 
          : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      
      {/* Mini preview */}
      <div className={`rounded-lg overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
        {/* Header preview */}
        <div className={`flex items-center justify-between px-3 py-2 border-b ${
          isDark ? 'border-zinc-700 bg-zinc-900' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded ${isDark ? 'bg-cyan-500' : 'bg-cyan-500'}`} />
            <div className={`w-12 h-2 rounded ${isDark ? 'bg-zinc-600' : 'bg-gray-300'}`} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-2 rounded ${isDark ? 'bg-zinc-600' : 'bg-gray-300'}`} />
            <div className={`w-6 h-2 rounded ${isDark ? 'bg-zinc-600' : 'bg-gray-300'}`} />
          </div>
        </div>
        
        {/* Content preview */}
        <div className={`p-3 space-y-3 ${isDark ? 'bg-zinc-950' : 'bg-gray-50'}`}>
          {/* Hero section */}
          <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-500/20'} flex items-center justify-center`}>
              <div className={`w-5 h-5 rounded ${isDark ? 'bg-cyan-400' : 'bg-cyan-500'}`} />
            </div>
            <div className={`w-20 h-3 rounded ${isDark ? 'bg-cyan-400' : 'bg-cyan-500'}`} />
            <div className={`w-28 h-2 rounded ${isDark ? 'bg-zinc-600' : 'bg-gray-300'}`} />
          </div>
          
          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-1.5">
            {[Mic, MessageSquare, FileSearch].map((Icon, i) => (
              <div 
                key={i}
                className={`p-2 rounded-lg flex flex-col items-center gap-1 ${
                  isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
                }`}
              >
                <Icon className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-cyan-500'}`} />
                <div className={`w-6 h-1 rounded ${isDark ? 'bg-zinc-600' : 'bg-gray-300'}`} />
              </div>
            ))}
          </div>
          
          {/* Button preview */}
          <div className="flex justify-center gap-2">
            <div className={`px-4 py-1.5 rounded-md text-[8px] font-medium ${
              isDark ? 'bg-cyan-500 text-zinc-900' : 'bg-cyan-500 text-white'
            }`}>
              Button
            </div>
            <div className={`px-4 py-1.5 rounded-md text-[8px] font-medium border ${
              isDark ? 'border-zinc-600 text-zinc-300' : 'border-gray-300 text-gray-700'
            }`}>
              Outline
            </div>
          </div>
        </div>
      </div>
      
      {/* Label */}
      <div className={`mt-2 mb-1 flex items-center justify-center gap-2 ${
        isDark ? 'text-foreground' : 'text-foreground'
      }`}>
        {isDark ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
        <span className="text-sm font-medium capitalize">{theme}</span>
      </div>
    </button>
  );
};

export const ThemePreview = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  
  const handleSelectTheme = (newTheme: 'light' | 'dark') => {
    // Add transition class for smooth animation
    document.documentElement.classList.add('theme-transition');
    setTheme(newTheme);
    
    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <div className="relative">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute top-0 left-0 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </div>
          <span className="hidden sm:inline">Theme</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Choose Your Theme</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <ThemeCard 
            theme="light" 
            isSelected={resolvedTheme === 'light'} 
            onSelect={() => handleSelectTheme('light')} 
          />
          <ThemeCard 
            theme="dark" 
            isSelected={resolvedTheme === 'dark'} 
            onSelect={() => handleSelectTheme('dark')} 
          />
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          Click a theme to preview and apply it instantly
        </p>
      </DialogContent>
    </Dialog>
  );
};
