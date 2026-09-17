import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function SingleItemPage({ categories = [] }) {
  const { categorySlug, itemSlug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadItem = async () => {
      try {
        const postsRes = await api.getPosts({ slug: itemSlug });
        const list = Array.isArray(postsRes) ? postsRes : [];
        const found =
          list.find((p) => p.slug === itemSlug || p.post_name === itemSlug || String(p.id) === itemSlug) ||
          list[0];

        if (!found) {
          throw new Error('Publicação ou produto não encontrado.');
        }

        if (isMounted) {
          setItem(found);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Erro ao carregar o item.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [itemSlug]);

  // Ativação de interatividade nos blocos Gutenberg de sanfona / details
  useEffect(() => {
    if (!contentRef.current) return;

    const detailsElements = contentRef.current.querySelectorAll('details');
    detailsElements.forEach((el) => {
      el.addEventListener('toggle', () => {
        el.classList.toggle('is-open', el.open);
      });
    });
  }, [item]);

  if (loading) {
    return (
      <div className="single-loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando publicação...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="single-error-card">
        <h2>404 - Não Encontrado</h2>
        <p>{error || 'Conteúdo não localizado.'}</p>
        <Link to={`/${categorySlug || ''}`} className="back-link">
          ← Voltar para a categoria
        </Link>
      </div>
    );
  }

  const title = item.name || item.post_title || item.title || 'Sem título';
  const rawDate = item.date_created || item.post_date;
  const dateFormatted = rawDate
    ? new Date(rawDate).toLocaleDateString('pt-BR')
    : 'Recente';
  const thumbUrl =
    item.thumbnail ||
    item.featured_image ||
    (item.images && item.images.length > 0
      ? typeof item.images[0] === 'string'
        ? item.images[0]
        : item.images[0].src
      : null);
  const content = item.post_content || item.description || item.content || '';
  const isProduct = item.type === 'product' || item.price !== undefined;
  const price = item.price || item.regular_price || null;

  return (
    <article className="single-article-view">
      <nav className="breadcrumbs">
        <Link to={`/${categorySlug}`} className="crumb-link">
          ← Voltar para {categorySlug}
        </Link>
      </nav>

      <header className="article-header">
        <div className="header-meta">
          {isProduct && <span className="meta-badge">Produto</span>}
          <span className="meta-date">Publicado em: {dateFormatted}</span>
        </div>
        <h1 className="article-title">{title}</h1>
        {price && (
          <div className="article-price-tag">
            <span>Preço: </span>
            <strong>R$ {parseFloat(price).toFixed(2).replace('.', ',')}</strong>
          </div>
        )}
      </header>

      {thumbUrl && (
        <div className="article-featured-image">
          <img src={thumbUrl} alt={title} />
        </div>
      )}

      <div
        ref={contentRef}
        className="article-body wp-block-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}
