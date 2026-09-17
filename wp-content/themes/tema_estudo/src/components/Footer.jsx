import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const siteName = window.EstudoApiConfig?.siteName || 'Tema Estudo';

  return (
    <footer className="react-footer">
      <div className="footer-container">
        <p className="footer-copyright">
          &copy; {currentYear} <strong>{siteName}</strong>. Desenvolvido com WordPress + React SPA.
        </p>
        <div className="footer-badges">
          <span className="footer-badge">React 18</span>
          <span className="footer-badge">Vite</span>
          <span className="footer-badge">WP REST API</span>
        </div>
      </div>
    </footer>
  );
}
