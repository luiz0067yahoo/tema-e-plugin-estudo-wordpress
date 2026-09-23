import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import NavbarCustomizer from './components/NavbarCustomizer';
import FeedPage from './pages/FeedPage';
import SingleItemPage from './pages/SingleItemPage';
import SearchPage from './pages/SearchPage';
import NotFoundPage from './pages/NotFoundPage';
import api from './services/api';

const DEFAULT_NAVBAR_CONFIG = {
  style: 'pill',
  align: 'left',
  sticky: true,
  accent: '#6366f1',
};

const getInitialNavbarConfig = () => {
  const wpConfig = window.EstudoApiConfig?.navbar || {};
  const base = { ...DEFAULT_NAVBAR_CONFIG, ...wpConfig };

  try {
    const saved = localStorage.getItem('tema_estudo_navbar_config');
    if (saved) {
      return { ...base, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('[Navbar] Erro ao carregar configurações salvas:', e);
  }

  return base;
};

export default function App() {
  const [categories, setCategories] = useState(() => {
    if (
      typeof window !== 'undefined' &&
      Array.isArray(window.EstudoApiConfig?.categories) &&
      window.EstudoApiConfig.categories.length > 0
    ) {
      const list = window.EstudoApiConfig.categories.filter(
        (c) => c.slug !== 'uncategorized' && c.name !== 'Sem categoria'
      );
      return list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    }
    return [];
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarConfig, setNavbarConfig] = useState(getInitialNavbarConfig);
  const location = useLocation();
  const navigate = useNavigate();

  // Redireciona buscas nativas do WordPress (?s= ou ?q=) para /busca/{termo}
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchVal = params.get('s') || params.get('q');
    if (searchVal && searchVal.trim()) {
      navigate(`/busca/${encodeURIComponent(searchVal.trim())}`, { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    api.getCategories().then((cats) => {
      const filtered = cats.filter(
        (c) => c.slug !== 'uncategorized' && c.name !== 'Sem categoria'
      );
      const list = filtered.length > 0 ? filtered : cats;
      list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
      setCategories(list);
    });
  }, []);

  const handleUpdateNavbar = (partial) => {
    setNavbarConfig((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem('tema_estudo_navbar_config', JSON.stringify(updated));
      } catch (e) {
        console.warn('Erro ao salvar no localStorage:', e);
      }
      return updated;
    });
  };

  const handleResetNavbar = () => {
    try {
      localStorage.removeItem('tema_estudo_navbar_config');
    } catch {}
    const wpConfig = window.EstudoApiConfig?.navbar || {};
    setNavbarConfig({ ...DEFAULT_NAVBAR_CONFIG, ...wpConfig });
  };

  return (
    <div className="react-app-root">
      <div className={`site-top-wrapper ${navbarConfig.sticky ? 'is-sticky' : ''}`}>
        <Header
          categories={categories}
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        />

        <Navbar
          categories={categories}
          isMenuOpen={isMenuOpen}
          onCloseMenu={() => setIsMenuOpen(false)}
          config={navbarConfig}
        />
      </div>

      <main className="react-main-container">
        <Routes>
          <Route path="/" element={<FeedPage categories={categories} />} />
          <Route path="/busca" element={<SearchPage categories={categories} />} />
          <Route path="/busca/:searchQuery" element={<SearchPage categories={categories} />} />
          <Route path="/search" element={<SearchPage categories={categories} />} />
          <Route path="/search/:searchQuery" element={<SearchPage categories={categories} />} />
          <Route path="/:categorySlug" element={<FeedPage categories={categories} />} />
          <Route path="/:categorySlug/:itemSlug" element={<SingleItemPage categories={categories} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
      <AuthModal />
      <NavbarCustomizer
        config={navbarConfig}
        onUpdateConfig={handleUpdateNavbar}
        onResetConfig={handleResetNavbar}
      />
    </div>
  );
}
