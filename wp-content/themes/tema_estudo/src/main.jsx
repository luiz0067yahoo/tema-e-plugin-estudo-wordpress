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
  let container = document.getElementById('root');
  if (!container) {
    console.warn('[React Theme] Elemento #root não encontrado. Injetando container dinamicamente...');
    container = document.createElement('div');
    container.id = 'root';
    const target = document.querySelector('.wp-site-blocks') || document.body;
    target.innerHTML = '';
    target.appendChild(container);
  }

  if (container.dataset.reactMounted === 'true') {
    return;
  }
  container.dataset.reactMounted = 'true';

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
