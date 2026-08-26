/**
 * Script individual para exibição e interatividade de Produtos (Product)
 * Tema: Tema Estudo
 */

async function initProductView() {
    const container = document.getElementById('api-single-product-container') || document.getElementById('api-product-container');
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

    const routeParams = window.getRouteParamsFromURL ? window.getRouteParamsFromURL(categories) : { categorySlug: null, itemSlug: null, productId: null };
    const productId = routeParams.productId || routeParams.postId;
    const targetSlug = routeParams.itemSlug;

    if (!productId && !targetSlug) return;

    container.innerHTML = '<div class="api-loading">Carregando detalhes do produto...</div>';

    try {
        let product = null;

        if (productId && window.estudoAPI) {
            if (typeof window.estudoAPI.getProductById === 'function') {
                product = await window.estudoAPI.getProductById(productId);
            } else {
                product = await window.estudoAPI.request(`products/${productId}`, { method: 'GET' });
            }
        } else if (targetSlug && window.estudoAPI) {
            let prodRes;
            if (typeof window.estudoAPI.getProducts === 'function') {
                prodRes = await window.estudoAPI.getProducts({ slug: targetSlug });
            } else {
                prodRes = await window.estudoAPI.getPosts({ slug: targetSlug, type: 'product' });
            }
            const prodsArray = Array.isArray(prodRes) ? prodRes : (prodRes && prodRes.data ? prodRes.data : []);
            product = prodsArray.find(p => p.slug === targetSlug || p.post_name === targetSlug) || prodsArray[0];
        }

        if (!product) {
            const render404 = window.render404HTML || ((msg) => `<div class="api-404-card"><h1>404</h1><p>${msg}</p></div>`);
            container.innerHTML = render404('Produto não encontrado ou indisponível.');
            return;
        }

        const title = product.name || product.title || product.post_title || 'Produto sem título';
        const productSlug = product.slug || product.post_name || targetSlug;
        const catSlug = routeParams.categorySlug || product.category_slug || (product.categories && product.categories.length > 0 ? product.categories[0].slug : 'home');
        const price = product.price || product.regular_price || product.meta_price || null;
        const salePrice = product.sale_price || null;
        const mainImage = product.featured_image || product.thumbnail || (product.images && product.images.length > 0 ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].src) : null);
        const description = product.description || product.post_content || product.short_description || 'Sem descrição cadastrada.';
        const sku = product.sku || product.product_sku || '';
        const inStock = product.in_stock !== undefined ? product.in_stock : true;

        // Atualiza a URL para rota amigável /categoria/produto-slug
        if ((window.location.search.includes('product_id=') || window.location.search.includes('post_id=')) && productSlug && window.history && window.history.replaceState) {
            const homeUrl = (window.EstudoApiConfig && window.EstudoApiConfig.homeUrl) ? window.EstudoApiConfig.homeUrl : '/';
            const cleanHomeUrl = homeUrl.endsWith('/') ? homeUrl : homeUrl + '/';
            const cleanUrl = `${cleanHomeUrl}${catSlug}/${productSlug}`;
            window.history.replaceState(null, '', cleanUrl);
        }

        // Formatação de Preço
        let priceHTML = '';
        if (price) {
            const numPrice = parseFloat(price);
            const formattedPrice = isNaN(numPrice) ? price : `R$ ${numPrice.toFixed(2).replace('.', ',')}`;
            if (salePrice) {
                const numSale = parseFloat(salePrice);
                const formattedSale = isNaN(numSale) ? salePrice : `R$ ${numSale.toFixed(2).replace('.', ',')}`;
                priceHTML = `<div class="api-product-price"><span class="regular-price strike">${formattedPrice}</span> <span class="sale-price">${formattedSale}</span></div>`;
            } else {
                priceHTML = `<div class="api-product-price"><span class="price">${formattedPrice}</span></div>`;
            }
        }

        container.innerHTML = `
            <div class="api-product-card-single">
                <div class="api-product-gallery">
                    ${mainImage ? `<img src="${mainImage}" class="api-product-main-img" alt="${title}" />` : '<div class="api-product-no-img">Sem Imagem</div>'}
                </div>
                <div class="api-product-details">
                    <h1 class="api-product-title">${title}</h1>
                    ${sku ? `<div class="api-product-sku">SKU: ${sku}</div>` : ''}
                    ${priceHTML}
                    <div class="api-product-stock ${inStock ? 'in-stock' : 'out-of-stock'}">
                        Status: ${inStock ? 'Em Estoque' : 'Indisponível'}
                    </div>
                    <div class="api-product-description">
                        <h3>Descrição</h3>
                        <div>${description}</div>
                    </div>
                    <div class="api-product-actions">
                        <button class="api-button api-buy-btn" ${!inStock ? 'disabled' : ''}>Comprar / Solicitar</button>
                    </div>
                </div>
            </div>
        `;

        if (window.initBlockInteractivity) {
            window.initBlockInteractivity(container);
        }
    } catch (err) {
        console.error('[Product JS] Erro ao carregar produto:', err);
        const render404 = window.render404HTML || ((msg) => `<div class="api-404-card"><h1>Erro</h1><p>${msg}</p></div>`);
        container.innerHTML = render404(`Erro ao carregar os dados do produto: ${err.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initProductView();
});

// Exporta globalmente para invocação modular
window.initProductView = initProductView;
