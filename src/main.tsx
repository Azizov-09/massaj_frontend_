import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initGlobalHorizontalScroll } from './utils/scrollHelper';

// Global listener for dynamic import chunk errors on new deployments
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] Preload error detected, reloading to fetch latest assets...', event);
  window.location.reload();
});

initGlobalHorizontalScroll();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
