import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Calcula dinamicamente o basename da URL do WordPress (útil se estiver em subdiretório como /wordpress ou /estudo)
const getBasename = () => {
  try {
    if (window.EstudoApiConfig && window.EstudoApiConfig.homeUrl) {
      const parsed = new URL(window.EstudoApiConfig.homeUrl, window.location.origin);
      const pathname = parsed.pathname;
      return pathname === '/' ? '' : pathname.replace(/\/$/, '');
    }
  } catch (e) {
    console.warn('[Router] Erro ao calcular basename:', e);
  }
  return '';
};

const mountApp = () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error('[React Theme] Elemento #root não encontrado no DOM.');
    return;
  }

  const basename = getBasename();
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
