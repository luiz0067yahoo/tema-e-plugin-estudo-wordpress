/**
 * Script individual para exibição de Categoria com APENAS 1 Post ou Produto (Single Item Category View)
 * Tema: Tema Estudo
 * 
 * Exibe o conteúdo completo e detalhado do post/produto diretamente na visualização da categoria
 * quando o total de publicações ou produtos encontrados for exatamente igual a 1.
 */

async function initCategoryOnlyPostOrProductView(categorySlugOverride = null, singleItemOverride = null) {
    const categoryPageContainer = document.getElementById('api-category-page-container') || document.getElementById('api-single-post-container');
    const postsContainer = document.getElementById('api-posts-container');
    const sectionTitle = document.getElementById('api-section-title');

    if (!categoryPageContainer && !postsContainer) return;

    const targetContainer = categoryPageContainer || postsContainer;

    const routeParams = window.getRouteParamsFromURL ? window.getRouteParamsFromURL() : {};
    if (routeParams.itemSlug || routeParams.postId || routeParams.productId) {
        return false;
    }

    try {
        let item = singleItemOverride;
        let catSlug = categorySlugOverride;

        if (!item && window.estudoAPI) {
            let categories = [];
            try {
                const catRes = await window.estudoAPI.getCategories();
                categories = Array.isArray(catRes) ? catRes : (catRes && Array.isArray(catRes.data) ? catRes.data : []);
            } catch (e) {
                categories = [];
            }

            if (!catSlug && window.getCurrentCategoryFromURL) {
                catSlug = window.getCurrentCategoryFromURL(categories);
            }

            if (catSlug) {
                const itemsRes = await window.estudoAPI.getPosts({ category: catSlug });
                const items = Array.isArray(itemsRes) ? itemsRes : (itemsRes && itemsRes.data ? itemsRes.data : []);

                // Executa esta exibição dedicada APENAS se houver exatamente 1 item
                if (items.length === 1) {
                    item = items[0];
                } else if (items.length === 0) {
                    return false; // Sem itens
                } else {
                    return false; // Mais de 1 item -> passar controle para category-1-or-plus
                }
            }
        }

        if (!item) return false;

        if (sectionTitle) {
            sectionTitle.textContent = `Categoria (Item Único): ${item.post_title || item.title || item.name || ''}`;
        }

        const title = item.post_title || item.title || item.name || 'Sem título';
        const content = item.post_content || item.description || item.content || '';
        const thumb = item.featured_image || item.thumbnail || (item.images && item.images.length > 0 ? (typeof item.images[0] === 'string' ? item.images[0] : item.images[0].src) : null);
        const dateRaw = item.post_date || item.date_created || item.date;
        const dateFormatted = dateRaw ? new Date(dateRaw).toLocaleDateString('pt-BR') : '';
        const isProduct = item.type === 'product' || item.price !== undefined;
        const price = item.price || item.regular_price || null;

        targetContainer.innerHTML = `
            <article class="api-category-single-item-card ${isProduct ? 'is-product' : 'is-post'}">
                <header class="api-single-item-header">
                    <h1 class="api-single-item-title">${title}</h1>
                    ${price ? `<div class="api-single-item-price">Preço: R$ ${parseFloat(price).toFixed(2).replace('.', ',')}</div>` : ''}
                </header>
                ${thumb ? `<div class="api-single-item-media"><img src="${thumb}" class="api-single-item-thumb" alt="${title}" /></div>` : ''}
                <div class="api-single-item-content">
                    ${content}
                </div>
                ${dateFormatted ? `<div class="api-single-item-meta">Publicado em: ${dateFormatted}</div>` : ''}
            </article>
        `;

        if (postsContainer && postsContainer !== targetContainer) {
            postsContainer.innerHTML = '';
        }

        if (window.initBlockInteractivity) {
            window.initBlockInteractivity(targetContainer);
        }

        return true;
    } catch (err) {
        console.error('[Category Only Post/Product JS] Erro ao renderizar item único de categoria:', err);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Tenta inicializar se o contexto da URL for de categoria única
    await initCategoryOnlyPostOrProductView();
});

// Exporta globalmente para invocação modular
window.initCategoryOnlyPostOrProductView = initCategoryOnlyPostOrProductView;
