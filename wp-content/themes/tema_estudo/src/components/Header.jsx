import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Header({ categories = [], activeCategory, onToggleMenu, isMenuOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState({
    site_name: window.EstudoApiConfig?.siteName || 'Tema Estudo',
    site_description: window.EstudoApiConfig?.description || 'WordPress REST API + React SPA',
    site_logo: '',
  });
  const { isAuthenticated, openAuth, logout } = useAuth();

  // Sincroniza o input com a URL se estiver na rota /busca/:query
  useEffect(() => {
    if (location.pathname.startsWith('/busca/')) {
      const query = decodeURIComponent(location.pathname.replace('/busca/', ''));
      setSearchQuery(query);
    } else if (location.pathname === '/busca') {
      const searchParams = new URLSearchParams(location.search);
      setSearchQuery(searchParams.get('s') || searchParams.get('q') || '');
    }
  }, [location.pathname, location.search]);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/busca/${encodeURIComponent(query)}`);
    } else {
      navigate('/busca');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (location.pathname.startsWith('/busca')) {
      navigate(homeTarget);
    }
  };

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

        <div className="header-search-container">
          <form className="header-search-form" onSubmit={handleSearchSubmit} role="search">
            <div className="header-search-wrap">
              <input
                type="text"
                className="header-search-input"
                placeholder="Buscar conteúdos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar conteúdos"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="header-search-clear"
                  onClick={handleClearSearch}
                  title="Limpar busca"
                  aria-label="Limpar busca"
                >
                  &times;
                </button>
              )}
              <button
                type="submit"
                className="header-search-btn"
                title="Pesquisar"
                aria-label="Pesquisar"
              >
                <svg
                  className="search-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="18"
                  height="18"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
          </form>
        </div>

        <div className="header-actions">
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
