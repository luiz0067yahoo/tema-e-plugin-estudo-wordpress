/**
 * Plugin Estudo REST API Consumer & Template Renderer
 * Theme: Tema Estudo
 */

class EstudoAPIClient {
    constructor() {
        // Fallback if localized config is missing
        this.config = window.EstudoApiConfig || {
            apiUrl: '/wp-json/api/v1/',
            nonce: '',
            siteName: 'WordPress Estudo'
        };
        this.tokenKey = 'estudo_jwt_token';
    }

    /**
     * Get stored JWT Token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey) || '';
    }

    /**
     * Set JWT Token in local storage
     */
    setToken(token) {
        if (token) {
            localStorage.setItem(this.tokenKey, token);
        } else {
            localStorage.removeItem(this.tokenKey);
        }
    }

    /**
     * Helper method to send requests with resilience, nonces, and JWT auth
     */
    async request(endpoint, options = {}) {
        let cleanEndpoint = endpoint.replace(/^\//, '');
        let baseUrl = (this.config.apiUrl || '/wp-json/api/v1/').replace(/\/$/, '');

        let url;
        if (baseUrl.includes('?')) {
            if (cleanEndpoint.includes('?')) {
                cleanEndpoint = cleanEndpoint.replace('?', '&');
            }
            url = `${baseUrl}/${cleanEndpoint}`;
        } else {
            url = `${baseUrl}/${cleanEndpoint}`;
        }

        const headers = {
            'Content-Type': 'application/json',
            'X-WP-Nonce': this.config.nonce,
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido na requisição.' }));
                throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`[API Estudo Error] Endpoint: ${endpoint} | URL: ${url}`, error.message);
            throw error;
        }
    }

    /**
     * Endpoints
     */

    // List Posts
    async getPosts(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `posts${queryParams ? `?${queryParams}` : ''}`;
        return await this.request(endpoint, { method: 'GET' });
    }

    // Get Post by ID
    async getPostById(id) {
        return await this.request(`posts/${id}`, { method: 'GET' });
    }

    // List Pages
    async getPages(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `pages${queryParams ? `?${queryParams}` : ''}`;
        return await this.request(endpoint, { method: 'GET' });
    }

    // Get Categories via REST API endpoint (/wp-json/api/v1/categories)
    async getCategories() {
        try {
            const data = await this.request('categories', { method: 'GET' });
            if (data && (Array.isArray(data) || (data.data && Array.isArray(data.data)))) {
                return data;
            }
        } catch (err) {
            console.warn('[API Estudo] Endpoint /wp-json/api/v1/categories falhou. Tentando fallback para /wp-json/wp/v2/categories...', err);
        }

        // Fallback nativo para a API REST padrao do WordPress
        try {
            const wpRestBase = (this.config.wpRestUrl || '/wp-json/').replace(/\/$/, '');
            const sep = wpRestBase.includes('?') ? '&' : '?';
            const response = await fetch(`${wpRestBase}/wp/v2/categories${sep}hide_empty=false&per_page=100`);
            if (response.ok) {
                const wpCats = await response.json();
                return wpCats.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    count: cat.count || 0,
                    description: cat.description || ''
                }));
            }
        } catch (fallbackErr) {
            console.error('[API Estudo] Falha ao carregar categorias via fallback WP REST API:', fallbackErr);
        }

        return [];
    }

    // List Products
    async getProducts(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `products${queryParams ? `?${queryParams}` : ''}`;
        try {
            return await this.request(endpoint, { method: 'GET' });
        } catch (e) {
            return await this.request(`posts?type=product${queryParams ? `&${queryParams}` : ''}`, { method: 'GET' });
        }
    }

    // Get Product by ID
    async getProductById(id) {
        try {
            return await this.request(`products/${id}`, { method: 'GET' });
        } catch (e) {
            return await this.request(`posts/${id}?type=product`, { method: 'GET' });
        }
    }

    // Get Settings
    async getSettings() {
        return await this.request('settings', { method: 'GET' });
    }

    // Authenticate (Login)
    async login(username, password) {
        const data = await this.request('login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data && data.jwt) {
            this.setToken(data.jwt);
        }
        return data;
    }

    // Logout
    async logout() {
        try {
            await this.request('logout', { method: 'POST' });
        } catch (e) {
            console.warn('Silent logout error:', e);
        } finally {
            this.setToken(null);
        }
    }
}

// Global API instance
window.estudoAPI = new EstudoAPIClient();

/**
 * Dynamic Template Renderers
 */
document.addEventListener('DOMContentLoaded', () => {
    initSiteSettings();
    initPostsFeed();
    initCategoriesList();
    initSinglePostView();
    initAuthModal();
});

/**
 * Load Site Settings dynamically via AJAX (/wp-json/api/v1/settings)
 */
async function initSiteSettings() {
    const logoEl = document.getElementById('api-site-logo');
    const titleEl = document.getElementById('api-site-title');
    const descEl = document.getElementById('api-site-description');

    if (!logoEl && !titleEl && !descEl) return;

    try {
        // Requisicao AJAX para a rota /wp-json/api/v1/settings
        const settings = await window.estudoAPI.getSettings();

        if (settings) {
            if (titleEl) {
                const titleLink = titleEl.querySelector('a') || titleEl;
                if (settings.title) {
                    titleLink.textContent = settings.title;
                }
            }

            if (descEl && settings.description !== undefined) {
                descEl.textContent = settings.description;
            }

            if (logoEl && settings.logo) {
                logoEl.src = settings.logo;
                logoEl.alt = settings.title || 'Logo';
                logoEl.style.display = 'inline-block';
            }
        }
    } catch (err) {
        console.warn('Erro ao carregar configuracoes via AJAX (/wp-json/api/v1/settings):', err);
    }
}

/**
 * Helper to get current category slug or ID from URL path or query params
 */
function getCurrentCategoryFromURL(categories = []) {
    const urlParams = new URLSearchParams(window.location.search);
    const catQuery = urlParams.get('category') || urlParams.get('category_name') || urlParams.get('cat');
    if (catQuery) {
        // If numeric ID, try finding category by ID
        if (!isNaN(catQuery)) {
            const match = categories.find(c => String(c.id || c.term_id) === String(catQuery));
            if (match) return match.slug;
        }
        const match = categories.find(c => c.slug === catQuery);
        if (match) return match.slug;
        return catQuery;
    }

    // Check path (e.g. /minhacategoria or /category/minhacategoria)
    const pathSegments = window.location.pathname.split('/').filter(p => p && p !== 'index.php');
    if (pathSegments.length > 0) {
        // Procura da direita para a esquerda nos segmentos da URL
        for (let i = pathSegments.length - 1; i >= 0; i--) {
            const seg = pathSegments[i];
            const match = categories.find(c => c.slug === seg);
            if (match) return match.slug;
        }
    }

    return null;
}

/**
 * Helper para extrair dinamicamente a Categoria e o Slug do Post/Produto a partir da URL amigável
 */
function getRouteParamsFromURL(categories = []) {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post_id') || urlParams.get('id');
    const productId = urlParams.get('product_id');

    const homeUrl = (window.EstudoApiConfig && window.EstudoApiConfig.homeUrl) ? window.EstudoApiConfig.homeUrl : '/';
    let homePath = '/';
    try {
        homePath = new URL(homeUrl, window.location.origin).pathname;
    } catch (e) {
        homePath = '/';
    }

    const rawPath = window.location.pathname;
    let relativePath = rawPath;
    if (homePath && homePath !== '/' && relativePath.startsWith(homePath)) {
        relativePath = relativePath.substring(homePath.length);
    }

    const segments = relativePath.split('/').filter(s => s && s !== 'index.php');

    let categorySlug = null;
    let itemSlug = null;

    if (segments.length === 1) {
        categorySlug = segments[0];
    } else if (segments.length >= 2) {
        categorySlug = segments[0];
        itemSlug = segments[1];
    }

    if (!categorySlug && categories.length > 0) {
        categorySlug = getCurrentCategoryFromURL(categories);
    }

    return {
        categorySlug,
        itemSlug,
        postId,
        productId
    };
}

/**
 * Load Categories List and render in Main Header Navigation & Sidebar
 */
async function initCategoriesList() {
    const headerNav = document.getElementById('api-header-nav');
    const sidebarNav = document.getElementById('api-categories-container');

    try {
        const catRes = await window.estudoAPI.getCategories();
        const categories = Array.isArray(catRes) ? catRes : (catRes && Array.isArray(catRes.data) ? catRes.data : []);

        if (!categories || categories.length === 0) {
            console.warn('Nenhuma categoria retornada pela API.');
            return;
        }

        const currentCatSlug = getCurrentCategoryFromURL(categories);
        const homeUrl = (window.EstudoApiConfig && window.EstudoApiConfig.homeUrl) ? window.EstudoApiConfig.homeUrl : '/';
        const cleanHomeUrl = homeUrl.endsWith('/') ? homeUrl : homeUrl + '/';

        // Render Header Main Navigation Menu: Cada Categoria como um item de Menu NAV (ul/li)
        if (headerNav) {
            headerNav.innerHTML = `
                <ul class="nav-menu">
                    ${categories.map(cat => {
                const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                const isActive = currentCatSlug === slug;
                const catUrl = cleanHomeUrl + slug;
                return `
                            <li class="nav-item-wrap">
                                <a href="${catUrl}" class="nav-item ${isActive ? 'active' : ''}">${cat.name}</a>
                            </li>
                        `;
            }).join('')}
                </ul>
            `;
        }

        // Render Sidebar Category list with verbose category slugs
        if (sidebarNav) {
            sidebarNav.innerHTML = `
                <ul class="api-cat-list">
                    <li><a href="${cleanHomeUrl}">Todas as Categorias</a></li>
                    ${categories.map(cat => {
                const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                const catUrl = cleanHomeUrl + slug;
                return `<li><a href="${catUrl}">${cat.name} (${cat.count || 0})</a></li>`;
            }).join('')}
                </ul>
            `;
        }
    } catch (err) {
        console.warn('Erro ao carregar categorias:', err);
    }
}

function render404HTML(customMessage = 'Desculpe, a página ou conteúdo solicitado não foi encontrado ou não existe no sistema.') {
    const homeUrl = (window.EstudoApiConfig && window.EstudoApiConfig.homeUrl) ? window.EstudoApiConfig.homeUrl : '/';
    return `
        <div class="api-404-container">
            <div class="api-404-card">
                <h1 class="api-404-code">404</h1>
                <h2 class="api-404-title">Conteúdo Não Encontrado</h2>
                <p class="api-404-message">${customMessage}</p>
            </div>
        </div>
    `;
}

/**
 * Load Category Page content (first) if present, then load Posts Grid (320px fluid layout)
 */
async function initPostsFeed() {
    const postsContainer = document.getElementById('api-posts-container');
    const categoryPageContainer = document.getElementById('api-category-page-container');
    const sectionTitle = document.getElementById('api-section-title');

    if (!postsContainer) return;

    postsContainer.innerHTML = '<div class="api-loading"></div>';
    if (categoryPageContainer) categoryPageContainer.innerHTML = '';

    try {
        let categories = [];
        try {
            const catRes = await window.estudoAPI.getCategories();
            categories = Array.isArray(catRes) ? catRes : (catRes && Array.isArray(catRes.data) ? catRes.data : []);
        } catch (e) {
            categories = [];
        }

        const routeParams = getRouteParamsFromURL(categories);
        if (routeParams.itemSlug || routeParams.postId || routeParams.productId) {
            if (categoryPageContainer) categoryPageContainer.innerHTML = '';
            return;
        }

        let currentCatSlug = getCurrentCategoryFromURL(categories);

        // Se não houver slug na URL e estiver na raiz / ou /home, redireciona para a primeira categoria cadastrada
        if (!currentCatSlug && categories.length > 0) {
            const firstCat = categories.find(c => c.slug && c.slug !== 'uncategorized' && c.name !== 'Sem categoria') || categories[0];
            if (firstCat && firstCat.slug) {
                const homeUrl = (window.EstudoApiConfig && window.EstudoApiConfig.homeUrl) ? window.EstudoApiConfig.homeUrl : '/';
                const cleanHomeUrl = homeUrl.endsWith('/') ? homeUrl : homeUrl + '/';
                const targetUrl = cleanHomeUrl + firstCat.slug;

                const pathSegments = window.location.pathname.split('/').filter(p => p && p !== 'index.php');
                const lastSegment = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : '';

                if (lastSegment === '' || lastSegment === 'home' || window.location.pathname === '/' || window.location.pathname === '/home' || window.location.pathname === '/home/') {
                    if (window.location.href !== targetUrl && lastSegment !== firstCat.slug) {
                        window.location.href = targetUrl;
                        return;
                    }
                }
            }
        }

        const currentCategory = Array.isArray(categories) ? categories.find(c => c.slug === currentCatSlug) : null;

        // 1. SE TIVER A PÁGINA NA CATEGORIA: Buscar primeiro a página com o mesmo slug da categoria
        if (currentCatSlug) {
            if (sectionTitle) {
                sectionTitle.textContent = `Categoria: ${currentCategory ? currentCategory.name : currentCatSlug}`;
            }

            try {
                const pageRes = await window.estudoAPI.getPages({ slug: currentCatSlug });
                const pagesArray = Array.isArray(pageRes) ? pageRes : (pageRes && pageRes.data ? pageRes.data : []);

                // Procura a página que corresponde exatamente ao slug da categoria
                const matchingPage = pagesArray.find(p => p.slug === currentCatSlug || p.post_name === currentCatSlug) || (pagesArray.length > 0 ? pagesArray[0] : null);

                if (matchingPage && categoryPageContainer) {
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
                    initBlockInteractivity(categoryPageContainer);
                }
            } catch (pageErr) {
                console.warn('Nenhuma página vinculada a esta categoria encontrada:', pageErr);
            }
        }

        // 2. LISTAR POSTS: 320px de largura com thumbnail, título e layout fluido
        const params = currentCatSlug ? { category: currentCatSlug } : {};
        const postsRes = await window.estudoAPI.getPosts(params);
        const posts = Array.isArray(postsRes) ? postsRes : (postsRes && postsRes.data ? postsRes.data : []);

        if (!posts || posts.length === 0) {
            if (!categoryPageContainer || !categoryPageContainer.innerHTML.trim()) {
                postsContainer.innerHTML = render404HTML('Nenhum artigo ou publicação foi encontrada nesta categoria.');
            } else {
                postsContainer.innerHTML = '<p class="api-empty">Nenhum post adicional nesta categoria.</p>';
            }
            return;
        }

        const isSinglePost = posts.length === 1;
        const homeUrl = (window.EstudoApiConfig && window.EstudoApiConfig.homeUrl) ? window.EstudoApiConfig.homeUrl : '/';
        const cleanHomeUrl = homeUrl.endsWith('/') ? homeUrl : homeUrl + '/';
        const catSlugForUrl = currentCatSlug || 'home';

        postsContainer.innerHTML = posts.map(post => {
            const postId = post.id || post.ID;
            const postTitle = post.name || post.post_title || post.title || 'Sem título';
            const postSlug = post.slug || post.post_name || postId;
            const thumbUrl = post.thumbnail || post.featured_image || (post.images && post.images.length > 0 ? post.images[0].src : '');
            const rawContent = post.description || post.post_content || '';
            const excerpt = post.short_description || post.post_excerpt || (rawContent ? rawContent.replace(/<BR>/g, ' ').replace(/<br>/g, ' ').replace(/<[^>]+>/g, '').substring(0, 110) + '...' : '');
            const contentToDisplay = isSinglePost ? rawContent : excerpt;
            const rawDate = post.date_created || post.post_date;
            const dateFormatted = rawDate ? new Date(rawDate).toLocaleDateString('pt-BR') : 'N/A';

            const targetUrl = `${cleanHomeUrl}${catSlugForUrl}/${postSlug}`;

            return `
                <article class="api-post-card">
                    <div>
                        ${(thumbUrl && !isSinglePost) ? `<a href="${targetUrl}"><img src="${thumbUrl}" class="api-post-thumb" alt="${postTitle}" /></a>` : ''}
                        <h3 class="api-post-title">
                            <a href="${targetUrl}">${postTitle}</a>
                        </h3>
                    </div>
                    <div>
                        ${contentToDisplay ? `<div class="api-post-excerpt">${contentToDisplay}</div>` : ''}
                        <div class="api-post-meta">
                            <span>Data: ${dateFormatted}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        initBlockInteractivity(postsContainer);

    } catch (err) {
        postsContainer.innerHTML = render404HTML(`Não foi possível carregar o conteúdo via REST API. (${err.message})`);
    }
}

/**
 * Load Single Post Details if post_id query parameter is present
 */
async function initSinglePostView() {
    const container = document.getElementById('api-single-post-container');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post_id');

    if (!postId) {
        container.innerHTML = render404HTML('ID de publicação não especificado.');
        return;
    }

    container.innerHTML = '<div class="api-loading"></div>';

    try {
        const post = await window.estudoAPI.getPostById(postId);

        if (!post) {
            container.innerHTML = render404HTML('Publicação não encontrada.');
            return;
        }

        container.innerHTML = `
            <article class="api-single-article">
                <h1 class="api-single-title">${post.post_title || post.title || post.name || 'Sem título'}</h1>
                <div class="api-single-content">
                    ${post.post_content || post.description || post.content || ''}
                </div>
                <div class="api-single-meta">
                    Publicado em: ${post.post_date || post.date_created ? new Date(post.post_date || post.date_created).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
            </article>
        `;
        initBlockInteractivity(container);
    } catch (err) {
        container.innerHTML = render404HTML(`Erro ao carregar post: ${err.message}`);
    }
}

/**
 * Handle Login / Auth Form if present
 */
function initAuthModal() {
    const form = document.getElementById('api-login-form');
    const statusEl = document.getElementById('api-login-status');
    const authBox = document.getElementById('api-auth-box');

    if (!form) return;

    // Check if token exists
    if (window.estudoAPI.getToken() && authBox) {
        authBox.innerHTML = `
            <p>Você está autenticado via JWT!</p>
            <button id="api-btn-logout" class="api-button">Sair (Logout)</button>
        `;
        document.getElementById('api-btn-logout')?.addEventListener('click', async () => {
            await window.estudoAPI.logout();
            window.location.reload();
        });
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = form.elements['username'].value;
        const password = form.elements['password'].value;

        if (statusEl) statusEl.textContent = 'Autenticando...';

        try {
            const res = await window.estudoAPI.login(username, password);
            if (statusEl) statusEl.textContent = 'Login efetuado com sucesso!';
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            if (statusEl) statusEl.textContent = `Erro no login: ${err.message}`;
        }
    });
}

/**
 * =====================================================================
 * MOTOR DE ACCORDION / SANFONA — GUTENBERG & PLUGINS
 * Suporta:
 *   • Gutenberg Core   → <details> / <summary> / .wp-block-details
 *   • UAGB FAQ         → .uagb-faq-child__outer-wrap / .uagb-faq-questions-button
 *   • UAGB Accordion   → .uagb-accordion-child__outer-wrap / .uagb-accordion-header
 *   • Kadence          → .kt-accordion-pane / .kt-blocks-accordion-header
 *   • Shortcodes Ult.  → .su-spoiler / .su-spoiler-title
 *   • Generic / API    → .accordion-item / .accordion-header
 *   • Custom API       → .api-accordion-block
 * =====================================================================
 */

/** Seletores de CONTAINER de accordion (o item pai) */
const ACCORDION_ITEM_SEL = [
    'details',
    '.wp-block-details',
    '.accordion-item',
    '.wp-block-accordion',
    '.uagb-faq-child__outer-wrap',
    '.uagb-faq-item',
    '.uagb-accordion-child__outer-wrap',
    '.kt-accordion-pane',
    '.su-spoiler',
    '.faq-item',
    '.api-accordion-block',
].join(', ');

/** Seletores de GATILHO (cabeçalho clicável) */
const ACCORDION_TRIGGER_SEL = [
    'summary',
    '.wp-block-details__summary',
    '.accordion-header',
    '.wp-block-accordion__header',
    '.uagb-faq-questions-button',
    '.uagb-accordion-header',
    '.kt-blocks-accordion-header',
    '.su-spoiler-title',
    '.faq-header',
    '[data-toggle="accordion"]',
].join(', ');

/** Seletores de CONTEÚDO (painel que abre/fecha) */
const ACCORDION_CONTENT_SEL = [
    '.wp-block-details__content',
    '.accordion-content',
    '.wp-block-accordion__content',
    '.uagb-faq-content',
    '.uagb-faq-body',
    '.uagb-accordion-content',
    '.kt-accordion-panel',
    '.su-spoiler-content',
    '.faq-answer',
    '.api-accordion-content',
].join(', ');

/**
 * Abre ou fecha um item de accordion individualmente.
 * @param {Element} item   - Elemento container do accordion
 * @param {boolean} force  - true = abrir, false = fechar, undefined = toggle
 */
function toggleAccordionItem(item, force) {
    const isNativeDetails = item.tagName.toLowerCase() === 'details';
    const isCurrentlyOpen = isNativeDetails
        ? item.open
        : item.classList.contains('is-open');

    const shouldOpen = force !== undefined ? force : !isCurrentlyOpen;

    if (isNativeDetails) {
        // Deixa o browser gerenciar <details> nativamente; apenas sincroniza a classe
        if (shouldOpen) {
            item.setAttribute('open', '');
            item.classList.add('is-open');
        } else {
            item.removeAttribute('open');
            item.classList.remove('is-open');
        }
    } else {
        // Accordion baseado em div/button
        const content = item.querySelector(ACCORDION_CONTENT_SEL)
            || Array.from(item.children).find(c => !c.matches(ACCORDION_TRIGGER_SEL));

        if (shouldOpen) {
            item.classList.add('is-open');
            item.setAttribute('aria-expanded', 'true');
            if (content) {
                content.style.display = 'block';
                content.setAttribute('aria-hidden', 'false');
            }
        } else {
            item.classList.remove('is-open');
            item.setAttribute('aria-expanded', 'false');
            if (content) {
                content.style.display = 'none';
                content.setAttribute('aria-hidden', 'true');
            }
        }
    }
}

/**
 * Inicializa todos os accordions dentro de um container após injeção dinâmica de HTML.
 * @param {Element|Document} container
 */
function initBlockInteractivity(container = document) {
    if (!container) return;

    const items = container.querySelectorAll(ACCORDION_ITEM_SEL);

    items.forEach(item => {
        const isNativeDetails = item.tagName.toLowerCase() === 'details';

        if (isNativeDetails) {
            // Sincroniza classe com estado nativo do atributo [open]
            if (item.open || item.hasAttribute('open')) {
                item.classList.add('is-open');
            } else {
                item.classList.remove('is-open');
            }
            return;
        }

        // Accordion baseado em div: define estado inicial via classe .is-open
        const isOpen = item.classList.contains('is-open');
        const content = item.querySelector(ACCORDION_CONTENT_SEL)
            || Array.from(item.children).find(c => !c.matches(ACCORDION_TRIGGER_SEL));

        // Define atributos de acessibilidade
        const trigger = item.querySelector(ACCORDION_TRIGGER_SEL);
        if (trigger) {
            trigger.setAttribute('role', 'button');
            trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (!trigger.hasAttribute('tabindex')) trigger.setAttribute('tabindex', '0');
        }

        if (content) {
            content.style.display = isOpen ? 'block' : 'none';
            content.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        }
    });
}

/**
 * Delegador Global de Cliques — captura cliques em qualquer accordion da página,
 * incluindo conteúdo injetado dinamicamente via API.
 */
document.addEventListener('click', function (e) {
    const trigger = e.target.closest(ACCORDION_TRIGGER_SEL);
    if (!trigger) return;

    const item = trigger.closest(ACCORDION_ITEM_SEL);
    if (!item) return;

    const isNativeDetails = item.tagName.toLowerCase() === 'details';

    if (isNativeDetails) {
        // Aguarda o browser processar a mudança de estado e então sincroniza a classe
        setTimeout(() => {
            item.classList.toggle('is-open', item.open);
        }, 10);
        return; // Não previne o comportamento padrão do <details>
    }

    // Para accordions baseados em div/button: previne navegação indesejada
    e.preventDefault();

    toggleAccordionItem(item);
});

/**
 * Suporte a teclado: Enter/Espaço nos triggers de accordion div/button.
 */
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest(ACCORDION_TRIGGER_SEL);
    if (!trigger) return;
    const item = trigger.closest(ACCORDION_ITEM_SEL);
    if (!item || item.tagName.toLowerCase() === 'details') return;
    e.preventDefault();
    toggleAccordionItem(item);
});

// Exporta utilitários globais para scripts individuais
window.render404HTML = render404HTML;
window.initBlockInteractivity = initBlockInteractivity;
window.getCurrentCategoryFromURL = getCurrentCategoryFromURL;
window.getRouteParamsFromURL = getRouteParamsFromURL;


