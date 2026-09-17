import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar({
  categories = [],
  isMenuOpen,
  onCloseMenu,
  config = {
    style: 'pill',
    align: 'left',
    sticky: true,
    showCounts: true,
    accent: '#6366f1',
  },
}) {
  if (!categories || categories.length === 0) return null;

  const styleClass = `is-style-${config.style || 'pill'}`;
  const alignClass = `is-align-${config.align || 'left'}`;
  const stickyClass = config.sticky ? 'is-sticky' : '';

  return (
    <>
      <nav
        className={`react-navbar ${styleClass} ${alignClass} ${stickyClass} ${
          isMenuOpen ? 'is-open' : ''
        }`}
        style={{
          '--nav-accent': config.accent || '#6366f1',
        }}
      >
        <div className="navbar-container">
          <ul className="nav-list">
            {categories.map((cat) => (
              <li key={cat.id || cat.slug} className="nav-item">
                <NavLink
                  to={`/${cat.slug}`}
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                  onClick={onCloseMenu}
                >
                  <span className="nav-text">{cat.name}</span>
                  {config.showCounts && cat.count > 0 && (
                    <span className="nav-count">{cat.count}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      {isMenuOpen && <div className="nav-backdrop" onClick={onCloseMenu} />}
    </>
  );
}
