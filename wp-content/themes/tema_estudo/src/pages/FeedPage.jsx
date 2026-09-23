import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { initGutenbergBlocks } from '../utils/gutenbergBlocks';
import api from '../services/api';
import CategoryBanner from '../components/CategoryBanner';
import PostCard from '../components/PostCard';

export default function FeedPage({ categories = [] }) {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get('s') || searchParams.get('q') || '';

  const [posts, setPosts] = useState([]);
  const [categoryPage, setCategoryPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const singleArticleRef = useRef(null);

  const shouldRedirect = !categorySlug && !searchQuery && categories.length > 0;

  // Redirecionamento da raiz para a primeira categoria se não for busca
  useEffect(() => {
    if (shouldRedirect) {
      const firstCat =
        categories.find(
          (c) => c.slug && c.slug !== 'uncategorized' && c.name !== 'Sem categoria'
        ) || categories[0];
      if (firstCat && firstCat.slug) {
        navigate(`/${firstCat.slug}`, { replace: true });
      }
    }
  }, [shouldRedirect, categories, navigate]);

  const currentCategory = categories.find((c) => c.slug === categorySlug);
  const currentCategoryName = searchQuery
    ? `Resultados para: "${searchQuery}"`
    : currentCategory
    ? currentCategory.name
    : categorySlug
    ? `Categoria: ${categorySlug}`
    : 'Todas as Publicações';

  useEffect(() => {
    // Se estiver prestes a redirecionar para a primeira categoria, não executa fetch duplo na raiz
    if (shouldRedirect) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        const params = {};
        if (categorySlug) params.category = categorySlug;
        if (searchQuery) params.s = searchQuery;

        const postsPromise = api.getPosts(params);
        const pagePromise =
          categorySlug && !searchQuery ? api.getPages({ slug: categorySlug }) : Promise.resolve([]);

        const [postsRes, pagesRes] = await Promise.all([postsPromise, pagePromise]);

        if (!isMounted) return;

        let postsList = Array.isArray(postsRes) ? postsRes : [];

        // Filtro client-side se for pesquisa
        if (searchQuery) {
          const lowerQ = searchQuery.toLowerCase().trim();
          postsList = postsList.filter((p) => {
            const title = (p.name || p.title || '').toLowerCase();
            const desc = (p.description || p.short_description || p.content || '').toLowerCase();
            return title.includes(lowerQ) || desc.includes(lowerQ);
          });
        }

        setPosts(postsList);

        const pagesList = Array.isArray(pagesRes) ? pagesRes : [];
        const matchingPage =
          pagesList.find((p) => p.slug === categorySlug || p.post_name === categorySlug) || null;
        setCategoryPage(matchingPage);
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Erro ao carregar os dados.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [categorySlug, searchQuery, shouldRedirect]);

  // Inicializa interatividade de blocos Gutenberg em artigos únicos
  useEffect(() => {
    if (posts.length === 1 && singleArticleRef.current) {
      initGutenbergBlocks(singleArticleRef.current);
    }
  }, [posts]);

  if (loading) {
    return (
      <div className="feed-loading-container">
        <div className="loading-spinner"></div>
        <p>{searchQuery ? `Buscando por "${searchQuery}"...` : 'Carregando publicações...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-alert-card is-error">
        <h3>Ops! Ocorreu um problema</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <CategoryBanner page={categoryPage} categoryName={currentCategoryName} />

      <section className="posts-section">
        {posts.length === 0 ? (
          !categoryPage && (
            <div className="feed-empty-card">
              <p>
                {searchQuery
                  ? `Nenhum conteúdo encontrado para "${searchQuery}". Tente outros termos.`
                  : 'Nenhuma publicação ou produto encontrado nesta categoria.'}
              </p>
            </div>
          )
        ) : posts.length === 1 ? (
          (() => {
            const single = posts[0];
            const singleTitle = single.name || single.post_title || single.title || 'Sem título';
            const singleDate = single.date_created || single.post_date;
            const singleDateFormatted = singleDate ? new Date(singleDate).toLocaleDateString('pt-BR') : '';
            const singleThumb =
              single.thumbnail ||
              single.featured_image ||
              (single.images && single.images.length > 0
                ? typeof single.images[0] === 'string'
                  ? single.images[0]
                  : single.images[0].src
                : null);
            const singleContent = single.description || single.post_content || single.content || '';
            const isProduct = single.type === 'product' || single.price !== undefined;
            const price = single.price || single.regular_price || null;

            return (
              <article ref={singleArticleRef} className="single-article-view single-post-in-feed">
                <header className="article-header">
                  <div className="header-meta">
                    {isProduct && <span className="meta-badge">Produto</span>}
                    {singleDateFormatted && <span className="meta-date">Publicado em: {singleDateFormatted}</span>}
                  </div>
                  <h1 className="article-title">{singleTitle}</h1>
                  {price && (
                    <div className="article-price-tag">
                      <span>Preço: </span>
                      <strong>R$ {parseFloat(price).toFixed(2).replace('.', ',')}</strong>
                    </div>
                  )}
                </header>

                {singleThumb && (
                  <div className="article-featured-image">
                    <img src={singleThumb} alt={singleTitle} />
                  </div>
                )}

                <div
                  className="article-body wp-block-content"
                  dangerouslySetInnerHTML={{ __html: singleContent }}
                />
              </article>
            );
          })()
        ) : (
          <div className="posts-grid">
            {posts.map((item) => (
              <PostCard
                key={item.id || item.ID || item.slug}
                item={item}
                categorySlug={categorySlug || 'post'}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
