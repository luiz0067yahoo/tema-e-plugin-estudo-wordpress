/**
 * Script individual para exibição e interatividade de Publicações (Post Single)
 * Tema: Tema Estudo
 */

async function initSinglePostView() {
    const container = document.getElementById('api-single-post-container') || document.getElementById('api-post-container') || document.getElementById('api-posts-container');
    if (!container) return;

    let categories = [];
    try {
        if (window.estudoAPI && typeof window.estudoAPI.getCategories === 'function') {
            const catRes = await window.estudoAPI.getCategories();
            categories = Array.isArray(catRes) ? catRes : (catRes && Array.isArray(catRes.data) ? catRes.data : []);
        }
    } catch (e) {
        categories = [];
    }

    const routeParams = window.getRouteParamsFromURL ? window.getRouteParamsFromURL(categories) : { categorySlug: null, itemSlug: null, postId: null };
    const postId = routeParams.postId;
    const targetSlug = routeParams.itemSlug;

    // Se não houver nem postId nem itemSlug na rota, este script não deve forçar renderização única
    if (!postId && !targetSlug) return;

    // Limpa contêiner da página de categoria caso exista
    const categoryPageContainer = document.getElementById('api-category-page-container');
    if (categoryPageContainer) categoryPageContainer.innerHTML = '';
    const sectionTitle = document.getElementById('api-section-title');

    container.innerHTML = '<div class="api-loading">Carregando publicação...</div>';

    try {
        let post = null;

        if (postId && window.estudoAPI) {
            post = await window.estudoAPI.getPostById(postId);
        } else if (targetSlug && window.estudoAPI) {
            const postsRes = await window.estudoAPI.getPosts({ slug: targetSlug });
            const postsArray = Array.isArray(postsRes) ? postsRes : (postsRes && postsRes.data ? postsRes.data : []);
            post = postsArray.find(p => p.slug === targetSlug || p.post_name === targetSlug) || postsArray[0];
        }

        if (!post) {
            const render404 = window.render404HTML || ((msg) => `<div class="api-404-card"><h1>404</h1><p>${msg}</p></div>`);
            container.innerHTML = render404('Publicação não encontrada.');
            return;
        }

        const title = post.post_title || post.title || post.name || 'Sem título';
        const postSlug = post.slug || post.post_name || targetSlug;
        const catSlug = routeParams.categorySlug || post.category_slug || (post.categories && post.categories.length > 0 ? post.categories[0].slug : 'home');
        const dateRaw = post.post_date || post.date_created || post.date;
        const dateFormatted = dateRaw ? new Date(dateRaw).toLocaleDateString('pt-BR') : 'N/A';
        const thumb = post.featured_image || post.thumbnail || (post.images && post.images.length > 0 ? (typeof post.images[0] === 'string' ? post.images[0] : post.images[0].src) : null);
        const content = post.post_content || post.description || post.content || '';
        const author = post.author_name || (post.author ? post.author.name : '');

        // Atualiza o título da seção se houver
        if (sectionTitle) {
            sectionTitle.textContent = `Publicação: ${title}`;
        }

        // Atualiza a URL do navegador para a rota amigável /categoria/slug-post se foi acessada via ?post_id=58
        if (window.location.search.includes('post_id=') && postSlug && window.history && window.history.replaceState) {
            const homeUrl = (window.EstudoApiConfig && window.EstudoApiConfig.homeUrl) ? window.EstudoApiConfig.homeUrl : '/';
            const cleanHomeUrl = homeUrl.endsWith('/') ? homeUrl : homeUrl + '/';
            const cleanUrl = `${cleanHomeUrl}${catSlug}/${postSlug}`;
            window.history.replaceState(null, '', cleanUrl);
        }

        container.innerHTML = `
            <article class="api-single-article">
                <header class="api-single-header">
                    <h1 class="api-single-title">${title}</h1>
                </header>
                <div class="api-single-content">
                    ${content}
                </div>
                <div class="api-single-meta">
                    <span>Publicado em: ${dateFormatted}</span>
                </div>
            </article>
        `;

        if (window.initBlockInteractivity) {
            window.initBlockInteractivity(container);
        }
    } catch (err) {
        console.error('[Post JS] Erro ao carregar publicação:', err);
        const render404 = window.render404HTML || ((msg) => `<div class="api-404-card"><h1>Erro</h1><p>${msg}</p></div>`);
        container.innerHTML = render404(`Erro ao carregar a publicação: ${err.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initSinglePostView();
});

// Exporta globalmente para invocação modular
window.initSinglePostView = initSinglePostView;
