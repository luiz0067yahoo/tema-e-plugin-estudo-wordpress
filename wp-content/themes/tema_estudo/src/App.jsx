import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import NavbarCustomizer from './components/NavbarCustomizer';
import FeedPage from './pages/FeedPage';
import SingleItemPage from './pages/SingleItemPage';
import NotFoundPage from './pages/NotFoundPage';
import api from './services/api';

const DEFAULT_NAVBAR_CONFIG = {
  style: 'pill',
  align: 'left',
  sticky: true,
  showCounts: true,
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
  const [categories, setCategories] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarConfig, setNavbarConfig] = useState(getInitialNavbarConfig);

  useEffect(() => {
    api.getCategories().then((cats) => {
      const filtered = cats.filter(
        (c) => c.slug !== 'uncategorized' && c.name !== 'Sem categoria'
      );
      setCategories(filtered.length > 0 ? filtered : cats);
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

      <main className="react-main-container">
        <Routes>
          <Route path="/" element={<FeedPage categories={categories} />} />
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
