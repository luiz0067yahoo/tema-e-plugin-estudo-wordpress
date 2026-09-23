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
  const [openSubDropdown, setOpenSubDropdown] = useState(null);
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

  // Organiza categorias em hierarquia com suporte a sub-níveis ilimitados
  const categoryTree = React.useMemo(() => {
    if (!displayCategories || displayCategories.length === 0) return [];

    // Se já vier estruturado com `children` (da árvore gerada pelo menu do WordPress)
    const hasPrebuiltChildren = displayCategories.some(
      (c) => Array.isArray(c.children) && c.children.length > 0
    );
    if (hasPrebuiltChildren) {
      return displayCategories;
    }

    // Caso seja uma lista plana com `parent`, monta a árvore
    const itemMap = new Map();
    displayCategories.forEach((cat) => {
      itemMap.set(cat.id, { ...cat, children: [] });
    });

    const roots = [];
    displayCategories.forEach((cat) => {
      const node = itemMap.get(cat.id);
      if (cat.parent && cat.parent > 0 && itemMap.has(cat.parent)) {
        itemMap.get(cat.parent).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots.length > 0 ? roots : displayCategories.map((cat) => ({ ...cat, children: [] }));
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

  // Filtro no menu mobile (busca recursiva em todos os níveis)
  const filteredMobileCategories = React.useMemo(() => {
    if (!mobileSearch.trim()) return categoryTree;
    const term = mobileSearch.toLowerCase();

    const filterNode = (node) => {
      const matches = node.name.toLowerCase().includes(term);
      const filteredChildren = (node.children || []).map(filterNode).filter(Boolean);
      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      return null;
    };

    return categoryTree.map(filterNode).filter(Boolean);
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

          {/* Lista de menus de categorias e sub-níveis */}
          <div className="navbar-scroll-viewport" ref={scrollRef} onScroll={checkScroll}>
            <ul className="nav-list">
              {(isMenuOpen ? filteredMobileCategories : categoryTree).map((cat) => {
                const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
                const isChildActive =
                  hasChildren &&
                  cat.children.some(
                    (sub) =>
                      location.pathname === `/${sub.slug}` ||
                      (sub.children && sub.children.some((g) => location.pathname === `/${g.slug}`))
                  );
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
                        to={cat.slug && cat.slug !== '#' ? `/${cat.slug}` : '#'}
                        className={({ isActive }) =>
                          `nav-link ${(isActive && cat.slug !== '#') || isChildActive ? 'is-active' : ''}`
                        }
                        onClick={(e) => {
                          if (cat.slug === '#' || !cat.slug) {
                            e.preventDefault();
                            setOpenDropdown(isDropdownOpen ? null : cat.id);
                          } else {
                            setOpenDropdown(null);
                            onCloseMenu();
                          }
                        }}
                      >
                        <span className="nav-text">{cat.name}</span>
                      </NavLink>

                      {isWpLoggedIn && cat.edit_url && (
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
                          aria-label={`Subníveis de ${cat.name}`}
                          aria-expanded={isDropdownOpen}
                        >
                          ▾
                        </button>
                      )}
                    </div>

                    {/* Submenu Dropdown de Primeiro Subnível */}
                    {hasChildren && (
                      <ul className={`nav-dropdown-menu ${isDropdownOpen ? 'is-visible' : ''}`}>
                        {cat.children.map((sub) => {
                          const hasSubChildren = Array.isArray(sub.children) && sub.children.length > 0;
                          const isSubActive =
                            location.pathname === `/${sub.slug}` ||
                            (hasSubChildren && sub.children.some((g) => location.pathname === `/${g.slug}`));
                          const isSubDropdownOpen = openSubDropdown === sub.id;

                          return (
                            <li
                              key={sub.id || sub.slug}
                              className={`nav-dropdown-item ${hasSubChildren ? 'has-sub-children' : ''} ${isSubDropdownOpen ? 'dropdown-open' : ''}`}
                              onMouseEnter={() => !isMenuOpen && hasSubChildren && setOpenSubDropdown(sub.id)}
                              onMouseLeave={() => !isMenuOpen && hasSubChildren && setOpenSubDropdown(null)}
                            >
                              <div className="nav-dropdown-link-group">
                                <NavLink
                                  to={sub.slug && sub.slug !== '#' ? `/${sub.slug}` : '#'}
                                  className={({ isActive }) =>
                                    `nav-dropdown-link ${(isActive && sub.slug !== '#') || isSubActive ? 'is-active' : ''}`
                                  }
                                  onClick={(e) => {
                                    if (sub.slug === '#' || !sub.slug) {
                                      e.preventDefault();
                                      setOpenSubDropdown(isSubDropdownOpen ? null : sub.id);
                                    } else {
                                      setOpenDropdown(null);
                                      setOpenSubDropdown(null);
                                      onCloseMenu();
                                    }
                                  }}
                                >
                                  <span className="nav-dropdown-bullet">•</span>
                                  <span className="nav-dropdown-text">{sub.name}</span>
                                </NavLink>

                                {isWpLoggedIn && sub.edit_url && (
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

                                {hasSubChildren && (
                                  <button
                                    type="button"
                                    className={`nav-dropdown-toggle is-nested ${isSubDropdownOpen ? 'is-open' : ''}`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setOpenSubDropdown(isSubDropdownOpen ? null : sub.id);
                                    }}
                                    aria-label={`Subníveis de ${sub.name}`}
                                    aria-expanded={isSubDropdownOpen}
                                  >
                                    ▸
                                  </button>
                                )}
                              </div>

                              {/* Submenu Dropdown de Segundo Subnível (Netos) */}
                              {hasSubChildren && (
                                <ul className={`nav-dropdown-submenu ${isSubDropdownOpen ? 'is-visible' : ''}`}>
                                  {sub.children.map((grand) => (
                                    <li key={grand.id || grand.slug} className="nav-dropdown-item is-grandchild">
                                      <div className="nav-dropdown-link-group">
                                        <NavLink
                                          to={`/${grand.slug}`}
                                          className={({ isActive }) =>
                                            `nav-dropdown-link ${isActive ? 'is-active' : ''}`
                                          }
                                          onClick={() => {
                                            setOpenDropdown(null);
                                            setOpenSubDropdown(null);
                                            onCloseMenu();
                                          }}
                                        >
                                          <span className="nav-dropdown-bullet">◦</span>
                                          <span className="nav-dropdown-text">{grand.name}</span>
                                        </NavLink>

                                        {isWpLoggedIn && grand.edit_url && (
                                          <a
                                            href={getCategoryEditUrl(grand)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="nav-cat-edit-btn is-sub"
                                            title={`Editar categoria "${grand.name}" no WordPress`}
                                            aria-label={`Editar categoria "${grand.name}" no WordPress`}
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
