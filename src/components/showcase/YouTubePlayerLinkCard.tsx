import { useNavigate } from 'react-router-dom';
import { Youtube, ExternalLink } from 'lucide-react';

export function YouTubePlayerLinkCard() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/youtube-player')}
      className="rounded-2xl bg-card border border-border glow-border flex flex-col items-center justify-center gap-3 overflow-hidden h-full p-6 hover:border-primary/50 transition-all duration-300 group cursor-pointer text-left w-full"
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
        <Youtube className="h-7 w-7 text-primary-foreground" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-semibold text-card-foreground font-display">YouTube Player</h3>
        <p className="text-[10px] text-muted-foreground mt-1">Full playback control</p>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-primary">
        <span>Open Player</span>
        <ExternalLink className="h-3 w-3" />
      </div>
    </button>
  );
}
