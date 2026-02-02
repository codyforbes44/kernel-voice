import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useWidgetTheme } from './WidgetTheme';

interface WidgetButtonProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export function WidgetButton({ isOpen, onClick, unreadCount = 0 }: WidgetButtonProps) {
  const { config, theme } = useWidgetTheme();

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        [config.position === 'bottom-left' ? 'left' : 'right']: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: 'none',
        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
        color: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        zIndex: 9998,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      <div
        style={{
          transition: 'transform 0.3s, opacity 0.2s',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </div>

      {unreadCount > 0 && !isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #ffffff',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </button>
  );
}
