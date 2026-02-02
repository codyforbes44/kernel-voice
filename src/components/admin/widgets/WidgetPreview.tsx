import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Volume1 } from 'lucide-react';

interface WidgetPreviewProps {
  brandName: string;
  brandLogo: string;
  brandColor: string;
  accentColor: string;
  greeting: string;
  placeholder: string;
  position: 'bottom-right' | 'bottom-left';
  enableVoice?: boolean;
  voiceProvider?: 'native' | 'elevenlabs';
  waveformStyle?: 'bars' | 'wave' | 'circular';
  enableTTS?: boolean;
}

// Simulated audio level bars for preview
function PreviewAudioBars({ color, isActive, style = 'bars' }: { color: string; isActive: boolean; style?: 'bars' | 'wave' | 'circular' }) {
  const [levels, setLevels] = useState([0.3, 0.5, 0.7, 0.5, 0.3]);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setLevels(prev => prev.map(() => 0.2 + Math.random() * 0.8));
      setPhase(p => (p + 0.3) % (Math.PI * 2));
    }, 100);
    
    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  // Bars style (classic equalizer)
  if (style === 'bars') {
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

  // Wave style (flowing sine wave)
  if (style === 'wave') {
    const points = Array.from({ length: 20 }, (_, i) => {
      const x = i * 2;
      const y = 8 + Math.sin(phase + i * 0.5) * levels[i % 5] * 6;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="40" height="16" className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Circular style (pulsing ring)
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  return (
    <div className="relative w-4 h-4 flex items-center justify-center">
      <div
        className="absolute rounded-full transition-all duration-75"
        style={{
          width: `${8 + avgLevel * 8}px`,
          height: `${8 + avgLevel * 8}px`,
          border: `2px solid ${color}`,
          opacity: 0.4,
        }}
      />
      <div
        className="rounded-full"
        style={{
          width: '6px',
          height: '6px',
          backgroundColor: color,
        }}
      />
    </div>
  );
}

// Simulated speaking waveform for TTS demo
function PreviewSpeakingWaveform({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-0.5 h-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-0.5 rounded-full"
          style={{
            height: '100%',
            backgroundColor: color,
            animation: `speaking-bar-preview 0.8s ease-in-out ${i * 0.1}s infinite`,
            transformOrigin: 'center',
          }}
        />
      ))}
      <style>
        {`
          @keyframes speaking-bar-preview {
            0%, 100% { transform: scaleY(0.4); }
            50% { transform: scaleY(1); }
          }
        `}
      </style>
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
  voiceProvider = 'native',
  waveformStyle = 'bars',
  enableTTS = false,
}: WidgetPreviewProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

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

  // Auto-demo the TTS speaking animation when TTS is enabled
  useEffect(() => {
    if (!enableTTS || !ttsEnabled) {
      setIsSpeaking(false);
      return;
    }
    
    // Demo the speaking state periodically (offset from recording demo)
    const demoInterval = setInterval(() => {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2500);
    }, 10000);
    
    // Initial demo after a delay
    const initialTimeout = setTimeout(() => {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2500);
    }, 3000);
    
    return () => {
      clearInterval(demoInterval);
      clearTimeout(initialTimeout);
    };
  }, [enableTTS, ttsEnabled]);

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
            <PreviewAudioBars color={brandColor} isActive={isRecording} style={waveformStyle} />
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
          <div className="p-3 space-y-3 bg-gray-50" style={{ minHeight: '160px' }}>
            {/* TTS Controls */}
            {enableTTS && (
              <div className="flex justify-end items-center gap-2 mb-1">
                {/* Volume control */}
                {ttsEnabled && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-full transition-all"
                    style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button
                      onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                      className="p-0.5"
                      style={{ color: brandColor }}
                    >
                      {volume === 0 ? <VolumeX className="w-3 h-3" /> : volume < 0.5 ? <Volume1 className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                    <div
                      className="overflow-hidden transition-all duration-200"
                      style={{ width: showVolumeSlider ? '50px' : '0px' }}
                    >
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-[50px] h-1 cursor-pointer"
                        style={{
                          accentColor: brandColor,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 min-w-[24px] text-center">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                )}
                
                {/* TTS toggle */}
                <button
                  onClick={() => {
                    if (isSpeaking) {
                      setIsSpeaking(false);
                    } else {
                      setTtsEnabled(!ttsEnabled);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all"
                  style={{
                    backgroundColor: isSpeaking ? '#ef4444' : (ttsEnabled ? brandColor : '#e5e5e5'),
                    color: isSpeaking || ttsEnabled ? '#fff' : '#666',
                    boxShadow: isSpeaking ? `0 0 0 2px ${brandColor}40` : 'none',
                  }}
                >
                  {isSpeaking ? (
                    <>
                      <PreviewSpeakingWaveform color="#fff" />
                      <span>Speaking</span>
                    </>
                  ) : ttsEnabled ? (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>Voice On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3 h-3" />
                      <span>Voice Off</span>
                    </>
                  )}
                </button>
              </div>
            )}

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