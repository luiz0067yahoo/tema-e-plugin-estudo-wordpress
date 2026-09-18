import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';

export default function SearchPage({ categories = [] }) {
  const { searchQuery } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Obtém o termo da rota /busca/:searchQuery ou dos parâmetros legados ?s= / ?q=
  const effectiveQuery = searchQuery
    ? decodeURIComponent(searchQuery)
    : (searchParams.get('s') || searchParams.get('q') || '').trim();

  // Se a rota foi acessada como /busca?s=termo ou /busca?q=termo, redireciona para a rota limpa /busca/{termo}
  useEffect(() => {
    const queryInUrl = searchParams.get('s') || searchParams.get('q');
    if (queryInUrl && queryInUrl.trim()) {
      navigate(`/busca/${encodeURIComponent(queryInUrl.trim())}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const [searchInput, setSearchInput] = useState(effectiveQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'post', 'page'

  useEffect(() => {
    setSearchInput(effectiveQuery);
    if (!effectiveQuery) {
      setResults([]);
      setLoading(false);
      return;
    }

    let isCurrent = true;
    setLoading(true);
    setError(null);

    api.searchAll(effectiveQuery)
      .then((data) => {
        if (!isCurrent) return;
        setResults(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!isCurrent) return;
        setError(err.message || 'Erro ao realizar a busca.');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [effectiveQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = searchInput.trim();
    if (term) {
      navigate(`/busca/${encodeURIComponent(term)}`);
    } else {
      navigate('/busca');
    }
  };

  const handleClear = () => {
    setSearchInput('');
    navigate('/busca');
  };

  // Filtra por tipo (todos, posts ou páginas)
  const filteredResults = results.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'page') return item.type === 'page';
    if (activeFilter === 'post') return item.type !== 'page';
    return true;
  });

  const postsCount = results.filter((i) => i.type !== 'page').length;
  const pagesCount = results.filter((i) => i.type === 'page').length;

  return (
    <div className="search-page">
      <section className="search-hero-card">
        <div className="search-hero-content">
          <span className="search-hero-tag">🔍 Pesquisa no Blog</span>
          <h1 className="search-hero-title">
            {effectiveQuery
              ? `Resultados para: "${effectiveQuery}"`
              : 'O que você procura hoje?'}
          </h1>
          <p className="search-hero-desc">
            Pesquise conteúdos completos em publicações, artigos e páginas do site.
          </p>

          <form onSubmit={handleSearchSubmit} className="search-main-form">
            <div className="search-input-wrapper">
              <span className="search-input-icon">🔎</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Digite palavras-chave (ex: missão, serviços, home)..."
                className="search-main-input"
                autoFocus
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="search-clear-btn"
                  title="Limpar campo"
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="search-submit-btn">
              Pesquisar
            </button>
          </form>
        </div>
      </section>

      {effectiveQuery && results.length > 0 && !loading && (
        <div className="search-filter-bar">
          <div className="search-filter-tabs">
            <button
              type="button"
              className={`search-filter-tab ${activeFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              Todos ({results.length})
            </button>
            {postsCount > 0 && (
              <button
                type="button"
                className={`search-filter-tab ${activeFilter === 'post' ? 'is-active' : ''}`}
                onClick={() => setActiveFilter('post')}
              >
                📄 Publicações ({postsCount})
              </button>
            )}
            {pagesCount > 0 && (
              <button
                type="button"
                className={`search-filter-tab ${activeFilter === 'page' ? 'is-active' : ''}`}
                onClick={() => setActiveFilter('page')}
              >
                📑 Páginas ({pagesCount})
              </button>
            )}
          </div>
          <span className="search-meta-text">
            Exibindo {filteredResults.length} de {results.length} resultado(s)
          </span>
        </div>
      )}

      {loading ? (
        <div className="feed-loading-container">
          <div className="loading-spinner"></div>
          <p>Pesquisando posts e páginas...</p>
        </div>
      ) : error ? (
        <div className="feed-alert-card is-error">
          <h3>Erro na pesquisa</h3>
          <p>{error}</p>
        </div>
      ) : effectiveQuery && filteredResults.length === 0 ? (
        <div className="feed-empty-card search-empty-state">
          <span className="search-empty-icon">📂</span>
          <h2>Nenhum resultado encontrado</h2>
          <p>
            Não encontramos publicações ou páginas correspondentes a "
            <strong>{effectiveQuery}</strong>".
          </p>
          <div className="search-tips">
            <strong>Dicas de pesquisa:</strong>
            <ul>
              <li>Verifique a ortografia das palavras.</li>
              <li>Tente usar termos mais genéricos ou sinônimos.</li>
              <li>Tente buscar pelo nome de uma categoria ou página existente.</li>
            </ul>
          </div>
        </div>
      ) : filteredResults.length > 0 ? (
        <section className="search-results-section">
          <div className="posts-grid">
            {filteredResults.map((item) => (
              <PostCard
                key={`${item.type || 'post'}-${item.id || item.slug}`}
                item={item}
                categorySlug={item.category || item.category_slug || 'post'}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="search-initial-state">
          <p>Digite no campo acima para pesquisar em todas as publicações e páginas.</p>
        </div>
      )}
    </div>
  );
}
