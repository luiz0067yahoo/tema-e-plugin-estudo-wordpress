import { initGutenbergBlocks } from '../utils/gutenbergBlocks';
import React, { useEffect, useRef } from 'react';
import EditPostButton from './EditPostButton';

export default function CategoryBanner({ page, categoryName }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    initGutenbergBlocks(contentRef.current);
  }, [page]);

  if (!page) {
    return (
      <div className="category-header">
        <h2 className="category-title">{categoryName}</h2>
      </div>
    );
  }

  const title = page.name || page.title || page.post_title || categoryName;
  const thumb = page.thumbnail || page.featured_image || null;
  const pageId = page.id || page.ID;
  const editUrl = page.edit_url;
  const content =
    page.description ||
    page.content ||
    page.post_content ||
    page.short_description ||
    '';

  return (
    <section className="category-banner-card">
      <div className="banner-top">
        <div className="banner-title-row">
          <h2 className="banner-title">{title}</h2>
          {pageId && (
            <EditPostButton
              postId={pageId}
              editUrl={editUrl}
              title={title}
              className="is-inline"
            />
          )}
        </div>
      </div>

      {thumb && (
        <div className="banner-thumb-wrap">
          <img src={thumb} alt={title} className="banner-thumb" />
          {pageId && (
            <EditPostButton postId={pageId} editUrl={editUrl} title={title} />
          )}
        </div>
      )}

      {content && (
        <div
          ref={contentRef}
          className="banner-content wp-block-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </section>
  );
}
