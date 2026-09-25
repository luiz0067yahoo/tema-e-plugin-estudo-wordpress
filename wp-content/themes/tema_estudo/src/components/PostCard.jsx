import React from 'react';
import { Link } from 'react-router-dom';
import EditPostButton from './EditPostButton';

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
  const rawContent = item.short_description || item.post_excerpt || item.description || item.post_content || item.content || '';
  const cleanText = rawContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
  const excerpt = cleanText.length > 130 ? cleanText.substring(0, 130) + '...' : cleanText;
  const rawDate = item.date_created || item.post_date;
  const dateFormatted = rawDate
    ? new Date(rawDate).toLocaleDateString('pt-BR')
    : 'Recente';
  const isPage = item.type === 'page';
  const isProduct = item.type === 'product' || item.price !== undefined;
  const price = item.price || item.regular_price || null;

  const targetLink = isPage ? `/${itemSlug}` : `/${categorySlug || 'post'}/${itemSlug}`;

  return (
    <article className={`post-card ${isProduct ? 'is-product' : isPage ? 'is-page' : 'is-post'}`}>
      <div className="card-thumb-wrapper">
        <Link to={targetLink} className="card-thumb-link">
          {thumbUrl ? (
            <img src={thumbUrl} alt={title} className="card-thumb" loading="lazy" />
          ) : (
            <div className="card-thumb-placeholder">
              <span>{isProduct ? '🛍️' : isPage ? '📑' : '📄'}</span>
            </div>
          )}
          {isProduct && <span className="card-badge is-product">Produto</span>}
          {isPage && <span className="card-badge is-page">Página</span>}
        </Link>
        <EditPostButton postId={itemId} editUrl={item.edit_url} title={title} />
      </div>

      <div className="card-body">
        <div className="card-title-row">
          <h3 className="card-title">
            <Link to={targetLink}>{title}</Link>
          </h3>
          {!thumbUrl && (
            <EditPostButton
              postId={itemId}
              editUrl={item.edit_url}
              title={title}
              className="is-inline card-inline-edit"
            />
          )}
        </div>

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
