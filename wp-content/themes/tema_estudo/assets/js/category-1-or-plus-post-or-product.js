/**
 * Script individual para exibição de Categoria com 1 ou MAIS Posts ou Produtos (List / Grid Feed View)
 * Tema: Tema Estudo
 * 
 * Exibe a grade/grid fluida de posts ou produtos pertencentes a uma categoria (cards de 320px mínimo),
 * além do topo/banner da página de categoria se houver.
 * 
 * Suporta a navegação por rotas amigáveis: /{categoria-slug}/{post-ou-produto-slug}
 */

async function initCategory1OrPlusPostOrProductView(categorySlugOverride = null) {
    const postsContainer = document.getElementById('api-posts-container');
    const categoryPageContainer = document.getElementById('api-category-page-container');
    const sectionTitle = document.getElementById('api-section-title');

    if (!postsContainer) return;

    try {
        let categories = [];
        try {
            if (window.estudoAPI && typeof window.estudoAPI.getCategories === 'function') {
                const catRes = await window.estudoAPI.getCategories();
                categories = Array.isArray(catRes) ? catRes : (catRes && Array.isArray(catRes.data) ? catRes.data : []);
            }
        } catch (e) {
            categories = [];
        }

        const routeParams = window.getRouteParamsFromURL ? window.getRouteParamsFromURL(categories) : { categorySlug: null, itemSlug: null, postId: null, productId: null };
        let currentCatSlug = categorySlugOverride || routeParams.categorySlug;
        const currentCategory = Array.isArray(categories) ? categories.find(c => c.slug === currentCatSlug) : null;
        const targetItemSlug = routeParams.itemSlug;
        const targetPostId = routeParams.postId || routeParams.productId;

        // ---------------------------------------------------------------------
        // SE A ROTA FOR DE UM POST/PRODUTO INDIVIDUAL (ex: /home/nome-slug-post-ou-produto ou ?post_id=58)
        // EXIBE SOMENTE O CONTEÚDO INDIVIDUAL DO POST E INTERROMPE O FEED DA CATEGORIA
        // ---------------------------------------------------------------------
        if (targetItemSlug || targetPostId) {
            if (categoryPageContainer) categoryPageContainer.innerHTML = '';
            
            // Tenta invocar a visão individual de Post ou Produto
            if (typeof window.initSinglePostView === 'function') {
                postsContainer.id = 'api-single-post-container';
                await window.initSinglePostView();
                return;
            }
        }

        postsContainer.innerHTML = '<div class="api-loading">Carregando lista de publicações e produtos...</div>';
        if (categoryPageContainer) categoryPageContainer.innerHTML = '';

        if (sectionTitle) {
            sectionTitle.textContent = currentCategory ? `Categoria: ${currentCategory.name}` : (currentCatSlug ? `Categoria: ${currentCatSlug}` : 'Todas as Publicações');
        }

        // 1. CARREGAR PÁGINA DA CATEGORIA (se houver página vinculada ao slug da categoria)
        if (currentCatSlug && categoryPageContainer && window.estudoAPI) {
            try {
                const pageRes = await window.estudoAPI.getPages({ slug: currentCatSlug });
                const pagesArray = Array.isArray(pageRes) ? pageRes : (pageRes && pageRes.data ? pageRes.data : []);
                const matchingPage = pagesArray.find(p => p.slug === currentCatSlug || p.post_name === currentCatSlug) || (pagesArray.length > 0 ? pagesArray[0] : null);

                if (matchingPage) {
                    const pageTitle = matchingPage.name || matchingPage.title || matchingPage.post_title || '';
                    const pageThumb = matchingPage.thumbnail || matchingPage.featured_image || null;
                    const pageContent = matchingPage.description || matchingPage.content || matchingPage.post_content || matchingPage.short_description || '';

                    categoryPageContainer.innerHTML = `
                        <section class="api-category-page-card">
                            <h2 class="api-category-page-title">${pageTitle}</h2>
                            ${pageThumb ? `<img src="${pageThumb}" class="api-category-page-thumb" alt="${pageTitle}" />` : ''}
                            <div class="api-category-page-content">${pageContent}</div>
                        </section>
                    `;
                    if (window.initBlockInteractivity) {
                        window.initBlockInteractivity(categoryPageContainer);
                    }
                }
            } catch (pageErr) {
                console.warn('[Category 1-or-plus JS] Nenhuma página vinculada a esta categoria encontrada:', pageErr);
            }
        }

        // 2. BUSCAR POSTS E PRODUTOS DA CATEGORIA
        const params = currentCatSlug ? { category: currentCatSlug } : {};
        let items = [];
        if (window.estudoAPI) {
            const postsRes = await window.estudoAPI.getPosts(params);
            items = Array.isArray(postsRes) ? postsRes : (postsRes && postsRes.data ? postsRes.data : []);
        }

        if (!items || items.length === 0) {
            if (!categoryPageContainer || !categoryPageContainer.innerHTML.trim()) {
                const render404 = window.render404HTML || ((msg) => `<div class="api-404-card"><h1>Nenhum conteúdo</h1><p>${msg}</p></div>`);
                postsContainer.innerHTML = render404('Nenhum artigo ou produto foi encontrado nesta categoria.');
            } else {
                postsContainer.innerHTML = '<p class="api-empty">Nenhum post ou produto adicional nesta categoria.</p>';
            }
            return;
        }

        // SE HOUVER APENAS 1 ITEM E O SCRIPT DE CATEGORIA ÚNICA ESTIVER DISPONÍVEL, DELEGA SE NECESSÁRIO
        if (items.length === 1 && typeof window.initCategoryOnlyPostOrProductView === 'function') {
            const handled = await window.initCategoryOnlyPostOrProductView(currentCatSlug, items[0]);
            if (handled) return;
        }

        const homeUrl = (window.EstudoApiConfig && window.EstudoApiConfig.homeUrl) ? window.EstudoApiConfig.homeUrl : '/';
        const cleanHomeUrl = homeUrl.endsWith('/') ? homeUrl : homeUrl + '/';
        const catSlugForUrl = currentCatSlug || 'home';

        // 3. RENDERIZAR LISTA / GRID DE POSTS E PRODUTOS COM ROTAS AMIGÁVEIS (EX: /home/nome-slug-post-ou-produto)
        postsContainer.innerHTML = items.map(item => {
            const itemId = item.id || item.ID;
            const title = item.name || item.post_title || item.title || 'Sem título';
            const itemSlug = item.slug || item.post_name || itemId;
            const thumbUrl = item.thumbnail || item.featured_image || (item.images && item.images.length > 0 ? (typeof item.images[0] === 'string' ? item.images[0] : item.images[0].src) : '');
            const rawContent = item.description || item.post_content || '';
            const excerpt = item.short_description || item.post_excerpt || (rawContent ? rawContent.replace(/<BR>/g, ' ').replace(/<br>/g, ' ').replace(/<[^>]+>/g, '').substring(0, 110) + '...' : '');
            const rawDate = item.date_created || item.post_date;
            const dateFormatted = rawDate ? new Date(rawDate).toLocaleDateString('pt-BR') : 'N/A';
            const isProduct = item.type === 'product' || item.price !== undefined;
            const price = item.price || item.regular_price || null;

            // Rota amigável: /{categoria-slug}/{post-ou-produto-slug}
            const targetUrl = `${cleanHomeUrl}${catSlugForUrl}/${itemSlug}`;

            return `
                <article class="api-post-card ${isProduct ? 'api-product-item' : 'api-post-item'}">
                    <div>
                        ${thumbUrl ? `<a href="${targetUrl}"><img src="${thumbUrl}" class="api-post-thumb" alt="${title}" /></a>` : ''}
                        <h3 class="api-post-title">
                            <a href="${targetUrl}">${title}</a>
                        </h3>
                    </div>
                    <div>
                        ${excerpt ? `<div class="api-post-excerpt">${excerpt}</div>` : ''}
                        <div class="api-post-meta">
                            <span>Data: ${dateFormatted}</span>
                            ${price ? `<span class="api-item-price"> | R$ ${parseFloat(price).toFixed(2).replace('.', ',')}</span>` : ''}
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        if (window.initBlockInteractivity) {
            window.initBlockInteractivity(postsContainer);
        }

    } catch (err) {
        console.error('[Category 1-or-plus JS] Erro ao carregar feed da categoria:', err);
        const render404 = window.render404HTML || ((msg) => `<div class="api-404-card"><h1>Erro</h1><p>${msg}</p></div>`);
        postsContainer.innerHTML = render404(`Não foi possível carregar a lista da categoria via REST API. (${err.message})`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initCategory1OrPlusPostOrProductView();
});

// Exporta globalmente para invocação modular
window.initCategory1OrPlusPostOrProductView = initCategory1OrPlusPostOrProductView;
