import React from 'react';
import { Link } from 'react-router-dom';

export default function PostCard({ item, categorySlug }) {
  const itemId = item.id || item.ID;
  const title = item.name || item.post_title || item.title || 'Sem título';
  const itemSlug = item.slug || item.post_name || itemId;
  const thumbUrl =
    item.thumbnail ||
    item.featured_image ||
    (item.images && item.images.length > 0
      ? typeof item.images[0] === 'string'
        ? item.images[0]
        : item.images[0].src
      : '');
  const rawContent = item.description || item.post_content || '';
  const excerpt =
    item.short_description ||
    item.post_excerpt ||
    (rawContent
      ? rawContent
          .replace(/<BR>/gi, ' ')
          .replace(/<[^>]+>/g, '')
          .substring(0, 110) + '...'
      : '');
  const rawDate = item.date_created || item.post_date;
  const dateFormatted = rawDate
    ? new Date(rawDate).toLocaleDateString('pt-BR')
    : 'Recente';
  const isProduct = item.type === 'product' || item.price !== undefined;
  const price = item.price || item.regular_price || null;

  const targetLink = `/${categorySlug || 'post'}/${itemSlug}`;

  return (
    <article className={`post-card ${isProduct ? 'is-product' : 'is-post'}`}>
      <Link to={targetLink} className="card-thumb-link">
        {thumbUrl ? (
          <img src={thumbUrl} alt={title} className="card-thumb" loading="lazy" />
        ) : (
          <div className="card-thumb-placeholder">
            <span>{isProduct ? '🛍️' : '📄'}</span>
          </div>
        )}
        {isProduct && <span className="card-badge">Produto</span>}
      </Link>

      <div className="card-body">
        <h3 className="card-title">
          <Link to={targetLink}>{title}</Link>
        </h3>

        {excerpt && <p className="card-excerpt">{excerpt}</p>}

        <div className="card-footer">
          <span className="card-date">{dateFormatted}</span>
          {price && (
            <span className="card-price">
              R$ {parseFloat(price).toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
