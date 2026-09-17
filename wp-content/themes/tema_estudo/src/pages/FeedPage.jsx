import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import CategoryBanner from '../components/CategoryBanner';
import PostCard from '../components/PostCard';

export default function FeedPage({ categories = [] }) {
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [categoryPage, setCategoryPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirecionamento limpo da raiz para a primeira categoria sem recarregar a página
  useEffect(() => {
    if (!categorySlug && categories.length > 0) {
      const firstCat =
        categories.find(
          (c) => c.slug && c.slug !== 'uncategorized' && c.name !== 'Sem categoria'
        ) || categories[0];
      if (firstCat && firstCat.slug) {
        navigate(`/${firstCat.slug}`, { replace: true });
      }
    }
  }, [categorySlug, categories, navigate]);

  const currentCategory = categories.find((c) => c.slug === categorySlug);
  const currentCategoryName = currentCategory
    ? currentCategory.name
    : categorySlug
    ? `Categoria: ${categorySlug}`
    : 'Todas as Publicações';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        const postsPromise = api.getPosts(categorySlug ? { category: categorySlug } : {});
        const pagePromise = categorySlug ? api.getPages({ slug: categorySlug }) : Promise.resolve([]);

        const [postsRes, pagesRes] = await Promise.all([postsPromise, pagePromise]);

        if (!isMounted) return;

        const postsList = Array.isArray(postsRes) ? postsRes : [];
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
  }, [categorySlug]);

  if (loading) {
    return (
      <div className="feed-loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando publicações...</p>
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
          <div className="feed-empty-card">
            <p>Nenhuma publicação ou produto encontrado nesta categoria.</p>
          </div>
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
