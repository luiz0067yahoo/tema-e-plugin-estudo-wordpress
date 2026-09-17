import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Header({ categories = [], activeCategory, onToggleMenu, isMenuOpen }) {
  const [settings, setSettings] = useState({
    site_name: window.EstudoApiConfig?.siteName || 'Tema Estudo',
    site_description: window.EstudoApiConfig?.description || 'WordPress REST API + React SPA',
    site_logo: '',
  });
  const { isAuthenticated, openAuth, logout } = useAuth();

  useEffect(() => {
    api.getSiteSettings().then((data) => {
      if (data) {
        setSettings({
          site_name: data.site_name || data.name || window.EstudoApiConfig?.siteName || 'Tema Estudo',
          site_description: data.site_description || data.description || '',
          site_logo: data.site_logo || data.logo || '',
        });
      }
    });
  }, []);

  const firstCatSlug = categories.length > 0 ? categories[0].slug : '';
  const homeTarget = firstCatSlug ? `/${firstCatSlug}` : '/';

  return (
    <header className="react-header">
      <div className="header-container">
        <div className="brand-group">
          <Link to={homeTarget} className="brand-link">
            {settings.site_logo ? (
              <img src={settings.site_logo} alt={settings.site_name} className="site-logo" />
            ) : null}
            <div className="brand-texts">
              <h1 className="site-title">{settings.site_name}</h1>
              {settings.site_description && (
                <p className="site-description">{settings.site_description}</p>
              )}
            </div>
          </Link>
        </div>

        <div className="header-actions">
          {isAuthenticated ? (
            <div className="auth-badge">
              <span className="auth-status-pill">Conectado</span>
              <button onClick={logout} className="btn-logout" title="Sair da conta">
                Sair
              </button>
            </div>
          ) : (
            <button onClick={openAuth} className="btn-login">
              Entrar (JWT)
            </button>
          )}

          <button
            className={`hamburger-btn ${isMenuOpen ? 'is-active' : ''}`}
            onClick={onToggleMenu}
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
