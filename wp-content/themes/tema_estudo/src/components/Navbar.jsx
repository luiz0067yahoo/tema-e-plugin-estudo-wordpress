import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Navbar({
  categories = [],
  topMenuCategories: propTopMenuCategories,
  isMenuOpen = false,
  onCloseMenu = () => { },
  config = {
    style: 'pill',
    align: 'left',
    sticky: true,
    accent: '#6366f1',
    bgColor: '#111827',
    textColor: '#94a3b8',
  },
}) {
  const { isAuthenticated } = useAuth();
  const scrollRef = useRef(null);
  const location = useLocation();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileSearch, setMobileSearch] = useState('');

  // Estado para armazenar exclusivamente as categorias presentes no menu topo do WordPress
  const [topMenuCategories, setTopMenuCategories] = useState(() => {
    if (propTopMenuCategories && propTopMenuCategories.length > 0) {
      return propTopMenuCategories;
    }
    if (
      typeof window !== 'undefined' &&
      Array.isArray(window.EstudoApiConfig?.topMenuCategories) &&
      window.EstudoApiConfig.topMenuCategories.length > 0
    ) {
      return window.EstudoApiConfig.topMenuCategories;
    }
    return null;
  });

  // Busca assíncrona caso não tenha sido injetado no HTML via SSR/wp_localize_script
  useEffect(() => {
    if (propTopMenuCategories && propTopMenuCategories.length > 0) {
      setTopMenuCategories(propTopMenuCategories);
      return;
    }
    if (
      typeof window !== 'undefined' &&
      Array.isArray(window.EstudoApiConfig?.topMenuCategories) &&
      window.EstudoApiConfig.topMenuCategories.length > 0
    ) {
      setTopMenuCategories(window.EstudoApiConfig.topMenuCategories);
      return;
    }

    api.getTopMenuCategories().then((menuCats) => {
      if (menuCats && menuCats.length > 0) {
        setTopMenuCategories(menuCats);
      }
    });
  }, [propTopMenuCategories]);

  // Lista efetiva para a Navbar:
  // Se houver categorias configuradas no menu topo do WordPress, exibe SOMENTE elas (na ordem do menu).
  // Caso nenhum menu tenha sido criado no WordPress ainda, usa as categorias gerais como fallback.
  const displayCategories = React.useMemo(() => {
    if (topMenuCategories && topMenuCategories.length > 0) {
      return topMenuCategories;
    }
    return categories;
  }, [topMenuCategories, categories]);

  // Verifica se o usuário tem privilégio de edição ou está logado no WordPress
  const isWpLoggedIn =
    Boolean(window.EstudoApiConfig?.canEditPosts) ||
    Boolean(window.EstudoApiConfig?.isLoggedIn) ||
    Boolean(window.EstudoApiConfig?.isEditMode) ||
    (typeof document !== 'undefined' && document.body?.classList?.contains('logged-in')) ||
    isAuthenticated;

  // Monta a URL para tela de edição da categoria no WordPress
  const getCategoryEditUrl = (c) => {
    if (c.edit_url) return c.edit_url;
    const adminBase = window.EstudoApiConfig?.adminUrl
      ? window.EstudoApiConfig.adminUrl.replace(/\/$/, '')
      : '/wp-admin';
    const catId = c.id || c.term_id;
    return `${adminBase}/term.php?taxonomy=category&tag_ID=${catId}&post_type=post`;
  };

  // Organiza categorias em hierarquia (pais e filhos)
  const categoryTree = React.useMemo(() => {
    if (!displayCategories || displayCategories.length === 0) return [];

    const hasHierarchy = displayCategories.some((c) => c.parent && c.parent > 0);
    if (!hasHierarchy) {
      // Todas planas
      return displayCategories.map((cat) => ({ ...cat, children: [] }));
    }

    const parents = displayCategories.filter((c) => !c.parent || c.parent === 0);
    const childrenMap = {};
    displayCategories.forEach((c) => {
      if (c.parent && c.parent > 0) {
        if (!childrenMap[c.parent]) childrenMap[c.parent] = [];
        childrenMap[c.parent].push(c);
      }
    });

    return parents.map((parent) => ({
      ...parent,
      children: childrenMap[parent.id] || [],
    }));
  }, [displayCategories]);

  // Monitora rolagem horizontal no desktop
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [displayCategories]);

  // Auto-scroll do item ativo para o centro da barra visível
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector('.nav-link.is-active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [location.pathname, displayCategories]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -220 : 220;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 250);
  };

  const styleClass = `is-style-${config.style || 'pill'}`;
  const alignClass = `is-align-${config.align || 'left'}`;
  const stickyClass = config.sticky ? 'is-sticky' : '';

  // Filtro no menu mobile
  const filteredMobileCategories = React.useMemo(() => {
    if (!mobileSearch.trim()) return categoryTree;
    const term = mobileSearch.toLowerCase();
    return categoryTree.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        (cat.children && cat.children.some((sub) => sub.name.toLowerCase().includes(term)))
    );
  }, [categoryTree, mobileSearch]);

  // Exibe skeleton se ainda estiver carregando
  if (!displayCategories || displayCategories.length === 0) {
    return (
      <nav
        className={`react-navbar ${styleClass} ${alignClass} ${stickyClass} ${isMenuOpen ? 'is-open' : ''}`}
        style={{
          '--nav-accent': config.accent || '#6366f1',
          '--nav-bg': config.bgColor || '#111827',
          '--nav-text': config.textColor || '#94a3b8',
        }}
        aria-label="Menu de Categorias"
      >
        <div className="navbar-container">
          <ul className="nav-list nav-skeleton-list">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <li key={i} className="nav-item">
                <span className="nav-skeleton-pill" style={{ width: `${60 + (i % 3) * 25}px` }}></span>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav
        className={`react-navbar ${styleClass} ${alignClass} ${stickyClass} ${isMenuOpen ? 'is-open' : ''
          }`}
        style={{
          '--nav-accent': config.accent || '#6366f1',
          '--nav-bg': config.bgColor || '#111827',
          '--nav-text': config.textColor || '#94a3b8',
        }}
        aria-label="Menu de Categorias"
      >
        <div className="navbar-container">
          {/* Botão de rolagem para esquerda (desktop) */}
          {canScrollLeft && (
            <button
              type="button"
              className="nav-scroll-btn is-left"
              onClick={() => handleScroll('left')}
              aria-label="Rolar para esquerda"
            >
              ‹
            </button>
          )}

          {/* Cabeçalho exclusivo para a gaveta no mobile */}
          <div className="navbar-mobile-header">
            <div className="navbar-mobile-title-wrap">
              <span className="navbar-mobile-icon">🏷️</span>
              <span className="navbar-mobile-title">Categorias</span>
            </div>
            <button
              type="button"
              className="navbar-mobile-close"
              onClick={onCloseMenu}
              aria-label="Fechar menu"
            >
              ✕
            </button>
          </div>

          {/* Campo de busca de categorias no mobile */}
          <div className="navbar-mobile-search">
            <input
              type="text"
              placeholder="Buscar categorias..."
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              className="navbar-search-input"
            />
            {mobileSearch && (
              <button
                type="button"
                className="navbar-search-clear"
                onClick={() => setMobileSearch('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Lista de menus de categorias */}
          <div className="navbar-scroll-viewport" ref={scrollRef} onScroll={checkScroll}>
            <ul className="nav-list">
              {(isMenuOpen ? filteredMobileCategories : categoryTree).map((cat) => {
                const hasChildren = cat.children && cat.children.length > 0;
                const isChildActive =
                  hasChildren &&
                  cat.children.some((sub) => location.pathname === `/${sub.slug}`);
                const isDropdownOpen = openDropdown === cat.id;

                return (
                  <li
                    key={cat.id || cat.slug}
                    className={`nav-item ${hasChildren ? 'has-children' : ''} ${isDropdownOpen ? 'dropdown-open' : ''
                      }`}
                    onMouseEnter={() => !isMenuOpen && hasChildren && setOpenDropdown(cat.id)}
                    onMouseLeave={() => !isMenuOpen && hasChildren && setOpenDropdown(null)}
                  >
                    <div className="nav-link-group">
                      <NavLink
                        to={`/${cat.slug}`}
                        className={({ isActive }) =>
                          `nav-link ${isActive || isChildActive ? 'is-active' : ''}`
                        }
                        onClick={() => {
                          setOpenDropdown(null);
                          onCloseMenu();
                        }}
                      >
                        <span className="nav-text">{cat.name}</span>
                      </NavLink>

                      {isWpLoggedIn && (
                        <a
                          href={getCategoryEditUrl(cat)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nav-cat-edit-btn"
                          title={`Editar categoria "${cat.name}" no WordPress`}
                          aria-label={`Editar categoria "${cat.name}" no WordPress`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="11"
                            height="11"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </a>
                      )}

                      {hasChildren && (
                        <button
                          type="button"
                          className={`nav-dropdown-toggle ${isDropdownOpen ? 'is-open' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenDropdown(isDropdownOpen ? null : cat.id);
                          }}
                          aria-label={`Subcategorias de ${cat.name}`}
                          aria-expanded={isDropdownOpen}
                        >
                          ▾
                        </button>
                      )}
                    </div>

                    {/* Submenu Dropdown de Subcategorias */}
                    {hasChildren && (
                      <ul className={`nav-dropdown-menu ${isDropdownOpen ? 'is-visible' : ''}`}>
                        {cat.children.map((sub) => (
                          <li key={sub.id || sub.slug} className="nav-dropdown-item">
                            <div className="nav-dropdown-link-group">
                              <NavLink
                                to={`/${sub.slug}`}
                                className={({ isActive }) =>
                                  `nav-dropdown-link ${isActive ? 'is-active' : ''}`
                                }
                                onClick={() => {
                                  setOpenDropdown(null);
                                  onCloseMenu();
                                }}
                              >
                                <span className="nav-dropdown-bullet">•</span>
                                <span className="nav-dropdown-text">{sub.name}</span>
                              </NavLink>

                              {isWpLoggedIn && (
                                <a
                                  href={getCategoryEditUrl(sub)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="nav-cat-edit-btn is-sub"
                                  title={`Editar subcategoria "${sub.name}" no WordPress`}
                                  aria-label={`Editar subcategoria "${sub.name}" no WordPress`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    width="10"
                                    height="10"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </a>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Botão de rolagem para direita (desktop) */}
          {canScrollRight && (
            <button
              type="button"
              className="nav-scroll-btn is-right"
              onClick={() => handleScroll('right')}
              aria-label="Rolar para direita"
            >
              ›
            </button>
          )}
        </div>
      </nav>

      {/* Backdrop para fechar o menu no mobile */}
      {isMenuOpen && <div className="nav-backdrop" onClick={onCloseMenu} />}
    </>
  );
}
