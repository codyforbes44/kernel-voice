import React from 'react';
import ReactDOM from 'react-dom/client';
import { KernelWidget } from './KernelWidget';
import { KernelWidgetConfig } from './types';

declare global {
  interface Window {
    KernelConfig?: KernelWidgetConfig;
    KernelWidget?: {
      init: (config: KernelWidgetConfig) => void;
      destroy: () => void;
    };
  }
}

let widgetRoot: ReactDOM.Root | null = null;
let widgetContainer: HTMLDivElement | null = null;

function init(config: KernelWidgetConfig) {
  if (!config.apiKey) {
    console.error('[KernelWidget] apiKey is required');
    return;
  }

  // Clean up existing widget if any
  destroy();

  // Create container
  widgetContainer = document.createElement('div');
  widgetContainer.id = 'kernel-widget-root';
  widgetContainer.style.cssText = 'position: fixed; z-index: 99999; pointer-events: none;';
  document.body.appendChild(widgetContainer);

  // Create shadow root for style isolation
  const shadowRoot = widgetContainer.attachShadow({ mode: 'open' });
  
  // Create inner container
  const innerContainer = document.createElement('div');
  innerContainer.style.cssText = 'pointer-events: auto;';
  shadowRoot.appendChild(innerContainer);

  // Render widget
  widgetRoot = ReactDOM.createRoot(innerContainer);
  widgetRoot.render(
    <React.StrictMode>
      <KernelWidget config={config} />
    </React.StrictMode>
  );
}

function destroy() {
  if (widgetRoot) {
    widgetRoot.unmount();
    widgetRoot = null;
  }
  if (widgetContainer) {
    widgetContainer.remove();
    widgetContainer = null;
  }
}

// Export API
window.KernelWidget = { init, destroy };

// Auto-init if config is present
if (window.KernelConfig) {
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init(window.KernelConfig!);
    });
  } else {
    init(window.KernelConfig);
  }
}

export { KernelWidget, init, destroy };
export type { KernelWidgetConfig };
