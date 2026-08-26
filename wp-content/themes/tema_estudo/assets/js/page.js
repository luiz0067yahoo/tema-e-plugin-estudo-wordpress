/**
 * Script individual para tratamento e exibição de Páginas (Page)
 * Tema: Tema Estudo
 */

async function initPageView() {
    const container = document.getElementById('api-page-container') || document.getElementById('api-single-page-container');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('page_id') || urlParams.get('id');
    
    // Obtém o slug a partir do caminho da URL (ex: /sobre/ ou /contato/)
    const pathSegments = window.location.pathname.split('/').filter(p => p && p !== 'index.php');
    const currentSlug = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : '';

    container.innerHTML = '<div class="api-loading">Carregando página...</div>';

    try {
        let page = null;

        if (pageId && window.estudoAPI) {
            page = await window.estudoAPI.request(`pages/${pageId}`, { method: 'GET' });
        } else if (currentSlug && window.estudoAPI) {
            const pageRes = await window.estudoAPI.getPages({ slug: currentSlug });
            const pagesArray = Array.isArray(pageRes) ? pageRes : (pageRes && pageRes.data ? pageRes.data : []);
            page = pagesArray.find(p => p.slug === currentSlug || p.post_name === currentSlug) || pagesArray[0];
        }

        if (!page) {
            const render404 = window.render404HTML || ((msg) => `<div class="api-404-card"><h1>404</h1><p>${msg}</p></div>`);
            container.innerHTML = render404('Página solicitada não foi encontrada.');
            return;
        }

        const pageTitle = page.title || page.post_title || page.name || 'Sem título';
        const pageContent = page.content || page.post_content || page.description || '';
        const pageThumb = page.featured_image || page.thumbnail || null;
        const pageDate = page.date || page.post_date ? new Date(page.date || page.post_date).toLocaleDateString('pt-BR') : '';

        container.innerHTML = `
            <article class="api-page-article">
                <header class="api-page-header">
                    <h1 class="api-page-title">${pageTitle}</h1>
                    ${pageDate ? `<div class="api-page-meta">Atualizado em: ${pageDate}</div>` : ''}
                </header>
                ${pageThumb ? `<div class="api-page-media"><img src="${pageThumb}" class="api-page-thumb" alt="${pageTitle}" /></div>` : ''}
                <div class="api-page-content">
                    ${pageContent}
                </div>
            </article>
        `;

        if (window.initBlockInteractivity) {
            window.initBlockInteractivity(container);
        }
    } catch (err) {
        console.error('[Page JS] Erro ao carregar a página:', err);
        const render404 = window.render404HTML || ((msg) => `<div class="api-404-card"><h1>Erro</h1><p>${msg}</p></div>`);
        container.innerHTML = render404(`Erro ao carregar conteúdo da página: ${err.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initPageView();
});

// Exporta globalmente para uso modular se necessário
window.initPageView = initPageView;
