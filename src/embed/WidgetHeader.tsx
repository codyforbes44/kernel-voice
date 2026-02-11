import React from 'react';
import { X, Minus, Phone, PhoneOff } from 'lucide-react';
import { useWidgetTheme } from './WidgetTheme';

interface WidgetHeaderProps {
  onClose: () => void;
  onMinimize: () => void;
  voiceMode?: boolean;
  onToggleVoiceMode?: () => void;
  showVoiceToggle?: boolean;
}

export function WidgetHeader({ onClose, onMinimize, voiceMode, onToggleVoiceMode, showVoiceToggle }: WidgetHeaderProps) {
  const { config, theme } = useWidgetTheme();

  const headerStyle = config.headerStyle || 'gradient';
  const headerBg = headerStyle === 'gradient'
    ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`
    : headerStyle === 'solid'
      ? theme.primaryColor
      : theme.isDark ? '#252540' : '#f8f8f8';
  const headerTextColor = headerStyle === 'minimal' && !theme.isDark ? theme.textColor : '#ffffff';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: headerBg,
        borderRadius: 'var(--kernel-radius) var(--kernel-radius) 0 0',
        color: headerTextColor,
        borderBottom: headerStyle === 'minimal' ? `1px solid var(--kernel-border)` : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {config.brandLogo && (
          <img
            src={config.brandLogo}
            alt={config.brandName || 'Logo'}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              objectFit: 'cover',
            }}
          />
        )}
        <span style={{ fontWeight: 600, fontSize: '15px' }}>
          {config.brandName || 'AI Assistant'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Voice mode toggle */}
        {showVoiceToggle && (
          <HeaderButton
            onClick={onToggleVoiceMode}
            label={voiceMode ? 'Switch to chat' : 'Switch to voice'}
            isActive={voiceMode}
            activeColor="#22c55e"
            headerStyle={headerStyle}
            isDark={theme.isDark}
          >
            {voiceMode ? <PhoneOff size={15} /> : <Phone size={15} />}
          </HeaderButton>
        )}
        <HeaderButton onClick={onMinimize} label="Minimize chat" headerStyle={headerStyle} isDark={theme.isDark}>
          <Minus size={16} />
        </HeaderButton>
        <HeaderButton onClick={onClose} label="Close chat" headerStyle={headerStyle} isDark={theme.isDark}>
          <X size={16} />
        </HeaderButton>
      </div>
    </div>
  );
}

function HeaderButton({
  onClick,
  label,
  children,
  isActive,
  activeColor,
  headerStyle,
  isDark,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
  isActive?: boolean;
  activeColor?: string;
  headerStyle: string;
  isDark: boolean;
}) {
  const isMinimal = headerStyle === 'minimal';
  const defaultBg = isMinimal
    ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')
    : 'rgba(255, 255, 255, 0.2)';
  const hoverBg = isMinimal
    ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)')
    : 'rgba(255, 255, 255, 0.3)';
  const color = isMinimal && !isDark ? '#333' : '#fff';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        background: isActive ? (activeColor || defaultBg) : defaultBg,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        color,
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = defaultBg; }}
      aria-label={label}
    >
      {children}
    </button>
  );
}
