import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const siteName = window.EstudoApiConfig?.siteName || 'Tema Estudo';

  return (
    <footer className="react-footer">
      <div className="footer-container">
        <p className="footer-copyright">
          &copy; {currentYear} <strong>{siteName}</strong>
        </p>
      </div>
    </footer>
  );
}
