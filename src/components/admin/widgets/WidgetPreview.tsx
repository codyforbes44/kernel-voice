import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, Volume1, Phone } from 'lucide-react';
import { getBorderRadiusValue, getBubbleRadiusValue } from '@/embed/types';

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
  darkMode?: boolean;
  headerStyle?: 'gradient' | 'solid' | 'minimal';
  borderRadius?: 'sharp' | 'rounded' | 'pill';
  bubbleStyle?: 'rounded' | 'sharp' | 'pill';
  enableVoiceConversation?: boolean;
}

function PreviewAudioBars({ color, isActive, style = 'bars' }: { color: string; isActive: boolean; style?: string }) {
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

  if (style === 'bars') {
    return (
      <div className="flex items-center justify-center gap-0.5 h-4">
        {levels.map((level, i) => (
          <div key={i} className="w-0.5 rounded-full transition-all duration-75" style={{ height: `${4 + level * 12}px`, backgroundColor: color }} />
        ))}
      </div>
    );
  }

  if (style === 'wave') {
    const points = Array.from({ length: 20 }, (_, i) => `${i * 2},${8 + Math.sin(phase + i * 0.5) * levels[i % 5] * 6}`).join(' ');
    return <svg width="40" height="16" className="overflow-visible"><polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" /></svg>;
  }

  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  return (
    <div className="relative w-4 h-4 flex items-center justify-center">
      <div className="absolute rounded-full transition-all duration-75" style={{ width: `${8 + avgLevel * 8}px`, height: `${8 + avgLevel * 8}px`, border: `2px solid ${color}`, opacity: 0.4 }} />
      <div className="rounded-full" style={{ width: '6px', height: '6px', backgroundColor: color }} />
    </div>
  );
}

function PreviewVoiceOrb({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div className="relative">
        <div className="absolute -inset-4 rounded-full animate-pulse" style={{ background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }} />
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}88)`, boxShadow: `0 0 20px ${color}40` }}>
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color: color }}>Listening...</span>
    </div>
  );
}

export function WidgetPreview({
  brandName, brandLogo, brandColor, accentColor, greeting, placeholder, position,
  enableVoice = false, waveformStyle = 'bars', enableTTS = false,
  darkMode = false, headerStyle = 'gradient', borderRadius = 'rounded',
  bubbleStyle = 'rounded', enableVoiceConversation = false,
}: WidgetPreviewProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);

  const radius = getBorderRadiusValue(borderRadius);
  const bubbleR = getBubbleRadiusValue(bubbleStyle);
  const bgColor = darkMode ? '#1a1a2e' : '#ffffff';
  const surfaceColor = darkMode ? '#252540' : '#f0f0f0';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const borderColor = darkMode ? '#333355' : '#e5e5e5';

  const headerBg = headerStyle === 'gradient'
    ? `linear-gradient(135deg, ${brandColor}, ${accentColor})`
    : headerStyle === 'solid' ? brandColor
    : darkMode ? '#252540' : '#f8f8f8';
  const headerTextColor = headerStyle === 'minimal' && !darkMode ? textColor : '#fff';

  useEffect(() => {
    if (!enableVoice) { setIsRecording(false); return; }
    const demo = setInterval(() => { setIsRecording(true); setTimeout(() => setIsRecording(false), 3000); }, 8000);
    const init = setTimeout(() => { setIsRecording(true); setTimeout(() => setIsRecording(false), 3000); }, 1500);
    return () => { clearInterval(demo); clearTimeout(init); };
  }, [enableVoice]);

  useEffect(() => {
    if (enableVoiceConversation) {
      const t = setTimeout(() => setShowVoiceMode(true), 2000);
      const t2 = setTimeout(() => setShowVoiceMode(false), 6000);
      const interval = setInterval(() => {
        setShowVoiceMode(true);
        setTimeout(() => setShowVoiceMode(false), 4000);
      }, 12000);
      return () => { clearTimeout(t); clearTimeout(t2); clearInterval(interval); };
    } else {
      setShowVoiceMode(false);
    }
  }, [enableVoiceConversation]);

  return (
    <div className="relative bg-muted/30 rounded-lg p-4 min-h-[400px] border">
      <div className="absolute top-2 left-2 text-xs text-muted-foreground font-medium">Live Preview</div>

      <div className="mt-6 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-20 bg-muted rounded mt-4" />
      </div>

      <div className={`absolute bottom-4 ${position === 'bottom-right' ? 'right-4' : 'left-4'}`} style={{ width: '280px' }}>
        {isRecording && !showVoiceMode && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg z-10" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#ef4444' }} />
            <PreviewAudioBars color={brandColor} isActive={isRecording} style={waveformStyle} />
            <span className="text-white text-xs font-medium">Listening...</span>
          </div>
        )}

        <div className="shadow-2xl overflow-hidden" style={{ borderRadius: radius, border: `1px solid ${borderColor}`, backgroundColor: bgColor }}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: headerBg, borderBottom: headerStyle === 'minimal' ? `1px solid ${borderColor}` : undefined }}>
            <div className="flex items-center gap-2">
              {brandLogo ? (
                <img src={brandLogo} alt="" className="w-7 h-7 rounded-full object-cover bg-white/20" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: headerStyle === 'minimal' ? surfaceColor : accentColor }}>
                  <MessageCircle className="w-4 h-4" style={{ color: headerTextColor }} />
                </div>
              )}
              <span className="font-medium text-sm" style={{ color: headerTextColor }}>{brandName || 'AI Assistant'}</span>
            </div>
            <div className="flex items-center gap-1">
              {enableVoiceConversation && (
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: showVoiceMode ? '#22c55e' : (headerStyle === 'minimal' && !darkMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.2)') }}>
                  <Phone className="w-3.5 h-3.5" style={{ color: headerTextColor }} />
                </div>
              )}
              <button style={{ color: headerStyle === 'minimal' && !darkMode ? '#999' : 'rgba(255,255,255,0.8)' }}><X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Content */}
          {showVoiceMode ? (
            <div style={{ backgroundColor: bgColor, minHeight: '160px' }}>
              <PreviewVoiceOrb color={brandColor} />
            </div>
          ) : (
            <>
              <div className="p-3 space-y-3" style={{ backgroundColor: bgColor, minHeight: '160px' }}>
                {/* TTS indicator */}
                {enableTTS && (
                  <div className="flex justify-end mb-1">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium" style={{ backgroundColor: brandColor, color: '#fff' }}>
                      <Volume2 className="w-3 h-3" /><span>Voice On</span>
                    </div>
                  </div>
                )}

                {/* Greeting */}
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                    <MessageCircle className="w-3 h-3 text-white" />
                  </div>
                  <div className="px-3 py-2 text-sm max-w-[200px]" style={{ borderRadius: `${bubbleR} ${bubbleR} ${bubbleR} 4px`, backgroundColor: surfaceColor, color: textColor }}>
                    {greeting}
                  </div>
                </div>

                {/* User message */}
                <div className="flex justify-end">
                  <div className="px-3 py-2 text-sm text-white max-w-[200px]" style={{ borderRadius: `${bubbleR} ${bubbleR} 4px ${bubbleR}`, backgroundColor: brandColor }}>
                    Hello!
                  </div>
                </div>

                {/* Response */}
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                    <MessageCircle className="w-3 h-3 text-white" />
                  </div>
                  <div className="px-3 py-2 text-sm max-w-[200px]" style={{ borderRadius: `${bubbleR} ${bubbleR} ${bubbleR} 4px`, backgroundColor: surfaceColor, color: textColor }}>
                    Hi there! How can I assist you today?
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="p-3" style={{ borderTop: `1px solid ${borderColor}`, backgroundColor: bgColor }}>
                <div className="flex items-center gap-2">
                  {enableVoice && (
                    <button className="p-2 rounded-full" style={{ backgroundColor: isRecording ? '#ef4444' : surfaceColor, color: isRecording ? '#fff' : brandColor }}>
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                  <input type="text" placeholder={isRecording ? 'Listening...' : placeholder} disabled className="flex-1 px-3 py-2 text-sm rounded-lg text-muted-foreground" style={{ backgroundColor: darkMode ? '#1e1e36' : '#fafafa', border: `1px solid ${borderColor}`, color: textColor }} />
                  <button className="p-2 text-white" style={{ backgroundColor: brandColor, borderRadius: '8px' }}><Send className="w-4 h-4" /></button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={`mt-3 flex ${position === 'bottom-right' ? 'justify-end' : 'justify-start'}`}>
          <div className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}>
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
