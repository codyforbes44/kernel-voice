import { MessageCircle, X, Send } from 'lucide-react';

interface WidgetPreviewProps {
  brandName: string;
  brandLogo: string;
  brandColor: string;
  accentColor: string;
  greeting: string;
  placeholder: string;
  position: 'bottom-right' | 'bottom-left';
}

export function WidgetPreview({
  brandName,
  brandLogo,
  brandColor,
  accentColor,
  greeting,
  placeholder,
  position,
}: WidgetPreviewProps) {
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
              <input
                type="text"
                placeholder={placeholder}
                disabled
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-gray-50 text-muted-foreground"
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
