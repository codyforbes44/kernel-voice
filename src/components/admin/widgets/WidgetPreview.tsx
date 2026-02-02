import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, MicOff } from 'lucide-react';

interface WidgetPreviewProps {
  brandName: string;
  brandLogo: string;
  brandColor: string;
  accentColor: string;
  greeting: string;
  placeholder: string;
  position: 'bottom-right' | 'bottom-left';
  enableVoice?: boolean;
}

// Simulated audio level bars for preview
function PreviewAudioBars({ color, isActive }: { color: string; isActive: boolean }) {
  const [levels, setLevels] = useState([0.3, 0.5, 0.7, 0.5, 0.3]);

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setLevels(prev => prev.map(() => 0.2 + Math.random() * 0.8));
    }, 100);
    
    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center gap-0.5 h-4">
      {levels.map((level, i) => (
        <div
          key={i}
          className="w-0.5 rounded-full transition-all duration-75"
          style={{
            height: `${4 + level * 12}px`,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

export function WidgetPreview({
  brandName,
  brandLogo,
  brandColor,
  accentColor,
  greeting,
  placeholder,
  position,
  enableVoice = false,
}: WidgetPreviewProps) {
  const [isRecording, setIsRecording] = useState(false);

  // Auto-demo the recording animation when voice is enabled
  useEffect(() => {
    if (!enableVoice) {
      setIsRecording(false);
      return;
    }
    
    // Demo the recording state periodically
    const demoInterval = setInterval(() => {
      setIsRecording(true);
      setTimeout(() => setIsRecording(false), 3000);
    }, 8000);
    
    // Initial demo after a short delay
    const initialTimeout = setTimeout(() => {
      setIsRecording(true);
      setTimeout(() => setIsRecording(false), 3000);
    }, 1500);
    
    return () => {
      clearInterval(demoInterval);
      clearTimeout(initialTimeout);
    };
  }, [enableVoice]);

  return (
    <div className="relative bg-muted/30 rounded-lg p-4 min-h-[400px] border">
      {/* Preview label */}
      <div className="absolute top-2 left-2 text-xs text-muted-foreground font-medium">
        Live Preview
      </div>

      {/* Mock website content */}
      <div className="mt-6 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-20 bg-muted rounded mt-4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>

      {/* Widget preview */}
      <div
        className={`absolute bottom-4 ${position === 'bottom-right' ? 'right-4' : 'left-4'}`}
        style={{ width: '280px' }}
      >
        {/* Audio level indicator tooltip - shows when recording */}
        {isRecording && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg z-10"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: '#ef4444' }}
            />
            <PreviewAudioBars color={brandColor} isActive={isRecording} />
            <span className="text-white text-xs font-medium">Listening...</span>
          </div>
        )}

        {/* Chat window */}
        <div
          className="rounded-xl shadow-2xl overflow-hidden border"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: brandColor }}
          >
            <div className="flex items-center gap-2">
              {brandLogo ? (
                <img
                  src={brandLogo}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover bg-white/20"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="font-medium text-white text-sm">
                {brandName || 'AI Assistant'}
              </span>
            </div>
            <button className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="p-3 space-y-3 bg-gray-50" style={{ minHeight: '140px' }}>
            {/* Greeting message */}
            <div className="flex gap-2">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <MessageCircle className="w-3 h-3 text-white" />
              </div>
              <div
                className="rounded-lg px-3 py-2 text-sm max-w-[200px]"
                style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}
              >
                {greeting}
              </div>
            </div>

            {/* Sample user message */}
            <div className="flex justify-end">
              <div
                className="rounded-lg px-3 py-2 text-sm text-white max-w-[200px]"
                style={{ backgroundColor: brandColor }}
              >
                Hello!
              </div>
            </div>

            {/* Sample response */}
            <div className="flex gap-2">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <MessageCircle className="w-3 h-3 text-white" />
              </div>
              <div
                className="rounded-lg px-3 py-2 text-sm max-w-[200px]"
                style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}
              >
                Hi there! How can I assist you today?
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="p-3 border-t bg-white">
            <div className="flex items-center gap-2">
              {enableVoice && (
                <button
                  className="p-2 rounded-full transition-all"
                  style={{
                    backgroundColor: isRecording ? '#ef4444' : '#f3f4f6',
                    color: isRecording ? '#ffffff' : brandColor,
                    boxShadow: isRecording ? '0 0 0 4px rgba(239, 68, 68, 0.2)' : 'none',
                  }}
                  onClick={() => setIsRecording(!isRecording)}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <input
                type="text"
                placeholder={isRecording ? 'Listening...' : placeholder}
                disabled
                className="flex-1 px-3 py-2 text-sm border rounded-lg text-muted-foreground transition-all"
                style={{
                  backgroundColor: isRecording ? '#f0fdf4' : '#fafafa',
                  borderColor: isRecording ? brandColor : '#e5e5e5',
                  borderWidth: isRecording ? '2px' : '1px',
                }}
              />
              <button
                className="p-2 rounded-lg text-white"
                style={{ backgroundColor: brandColor }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating button preview below */}
        <div className={`mt-3 flex ${position === 'bottom-right' ? 'justify-end' : 'justify-start'}`}>
          <div
            className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: brandColor }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}