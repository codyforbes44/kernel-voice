import React from 'react';
import { X, Minus } from 'lucide-react';
import { useWidgetTheme } from './WidgetTheme';

interface WidgetHeaderProps {
  onClose: () => void;
  onMinimize: () => void;
}

export function WidgetHeader({ onClose, onMinimize }: WidgetHeaderProps) {
  const { config, theme } = useWidgetTheme();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
        borderRadius: 'var(--kernel-radius) var(--kernel-radius) 0 0',
        color: '#ffffff',
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
        <button
          onClick={onMinimize}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#ffffff',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          aria-label="Minimize chat"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#ffffff',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          aria-label="Close chat"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
