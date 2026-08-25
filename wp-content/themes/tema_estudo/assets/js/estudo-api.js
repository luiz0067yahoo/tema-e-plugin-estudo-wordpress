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
    const catQuery = urlParams.get('category');
    if (catQuery) {
        // If numeric ID, try finding category by ID
        if (!isNaN(catQuery)) {
            const match = categories.find(c => String(c.id || c.term_id) === String(catQuery));
            if (match) return match.slug;
        }
        return catQuery;
    }

    // Check path (e.g. /minhacategoria or /category/minhacategoria)
    const pathSegments = window.location.pathname.split('/').filter(p => p && p !== 'index.php');
    if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        const match = categories.find(c => c.slug === lastSegment);
        if (match) return match.slug;
    }

    return null;
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

        // Render Header Main Navigation Menu: Cada Categoria como um item de Menu NAV (ul/li)
        if (headerNav) {
            headerNav.innerHTML = `
                <ul class="nav-menu">
                    ${categories.map(cat => {
                const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                const isActive = currentCatSlug === slug;
                return `
                            <li class="nav-item-wrap">
                                <a href="/${slug}" class="nav-item ${isActive ? 'active' : ''}">${cat.name}</a>
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
                    <li><a href="/">Todas as Categorias</a></li>
                    ${categories.map(cat => {
                const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                return `<li><a href="/${slug}">${cat.name} (${cat.count || 0})</a></li>`;
            }).join('')}
                </ul>
            `;
        }
    } catch (err) {
        console.warn('Erro ao carregar categorias:', err);
    }
}

function render404HTML(customMessage = 'Desculpe, a página ou conteúdo solicitado não foi encontrado ou não existe no sistema.') {
    return `
        <div class="api-404-container">
            <div class="api-404-card">
                <h1 class="api-404-code">404</h1>
                <h2 class="api-404-title">Conteúdo Não Encontrado</h2>
                <p class="api-404-message">${customMessage}</p>
                <div class="api-404-actions">
                    <a href="/" class="api-button-404">&larr; Voltar para a Página Inicial</a>
                </div>
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

        let currentCatSlug = getCurrentCategoryFromURL(categories);

        // Se não houver slug na URL e estiver na raiz / ou /home, redireciona para a primeira categoria cadastrada
        if (!currentCatSlug && categories.length > 0) {
            const firstCat = categories.find(c => c.slug && c.slug !== 'uncategorized' && c.name !== 'Sem categoria') || categories[0];
            if (firstCat && firstCat.slug && (window.location.pathname === '/' || window.location.pathname === '/home' || window.location.pathname === '/home/')) {
                window.location.href = '/' + firstCat.slug;
                return;
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

        postsContainer.innerHTML = posts.map(post => {
            const postId = post.id || post.ID;
            const postTitle = post.name || post.post_title || post.title || 'Sem título';
            const thumbUrl = post.thumbnail || post.featured_image || (post.images && post.images.length > 0 ? post.images[0].src : '');
            const rawContent = post.description || post.post_content || '';
            const excerpt = post.short_description || post.post_excerpt || (rawContent ? rawContent.replace(/<BR>/g, ' ').replace(/<br>/g, ' ').replace(/<[^>]+>/g, '').substring(0, 110) + '...' : '');
            const contentToDisplay = isSinglePost ? rawContent : excerpt;
            const rawDate = post.date_created || post.post_date;
            const dateFormatted = rawDate ? new Date(rawDate).toLocaleDateString('pt-BR') : 'N/A';

            return `
                <article class="api-post-card">
                    <div>
                        ${thumbUrl ? `<img src="${thumbUrl}" class="api-post-thumb" alt="${postTitle}" />` : ''}
                        <h3 class="api-post-title">
                            <a href="?post_id=${postId}">${postTitle}</a>
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
                <div class="api-single-meta">
                    Publicado em: ${post.post_date || post.date_created ? new Date(post.post_date || post.date_created).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
                ${post.featured_image || post.thumbnail ? `<img src="${post.featured_image || post.thumbnail}" class="api-single-thumb" alt="" />` : ''}
                <div class="api-single-content">
                    ${post.post_content || post.description || post.content || ''}
                </div>
                <div class="api-back-link">
                    <a href="javascript:history.back()">&larr; Voltar para a lista</a>
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
 * Inicializa a interatividade de blocos do Gutenberg e Sanfonas (Accordions Nativos & Plugins)
 */
function initBlockInteractivity(container = document) {
    if (!container) return;

    // 1. Sincroniza estado inicial dos elementos <details> nativos ou .wp-block-details
    const detailsElements = container.querySelectorAll('details, .wp-block-details');
    detailsElements.forEach(details => {
        if (details.hasAttribute('open') || details.open) {
            details.classList.add('is-open');
        } else {
            details.classList.remove('is-open');
        }
    });

    // 2. Sincroniza estado inicial de sanfonas baseadas em divs/buttons (Gutenberg & Plugins)
    const accordionItems = container.querySelectorAll('.accordion-item, .wp-block-accordion, .uagb-faq-item, .uagb-faq-child__outer-wrap, .uagb-accordion-child__outer-wrap, .kt-accordion-pane, .su-spoiler, .faq-item, .api-accordion-block');
    accordionItems.forEach(item => {
        const isOpen = item.classList.contains('is-open');
        const trigger = item.querySelector('summary, .accordion-header, .wp-block-accordion__header, .uagb-faq-questions-button, .uagb-accordion-header, .kt-blocks-accordion-header, button');
        const content = item.querySelector('.accordion-content, .wp-block-accordion__content, .uagb-faq-content, .uagb-accordion-content, .kt-accordion-panel, .su-spoiler-content, .faq-answer')
                     || Array.from(item.children).find(child => child !== trigger && (!trigger || !child.contains(trigger)));

        if (content && content !== trigger) {
            content.style.display = isOpen ? 'block' : 'none';
        }
    });
}

/**
 * Delegador de Eventos Global de Clique para Sanfonas
 */
document.addEventListener('click', function(e) {
    // Procura por botões, summaries ou títulos H1-H6 de sanfona clicados
    const trigger = e.target.closest('summary, .wp-block-details__summary, .accordion-header, .wp-block-accordion__header, .uagb-faq-questions-button, .uagb-accordion-header, .kt-blocks-accordion-header, .su-spoiler-title, .faq-header, details summary, .accordion-item > button, details button, .wp-block-details button, [data-toggle="accordion"], h1, h2, h3, h4, h5, h6');

    if (!trigger) return;

    const details = trigger.closest('details, .wp-block-details');
    const accordionItem = trigger.closest('.accordion-item, .wp-block-accordion, .uagb-faq-item, .uagb-faq-child__outer-wrap, .uagb-accordion-child__outer-wrap, .kt-accordion-pane, .su-spoiler, .faq-item, .api-accordion-block');

    // 1. Tratamento para tags <details> (Gutenberg Core Details)
    if (details && details.tagName.toLowerCase() === 'details') {
        setTimeout(() => {
            if (details.open || details.hasAttribute('open')) {
                details.classList.add('is-open');
            } else {
                details.classList.remove('is-open');
            }
        }, 15);
        return;
    }

    // 2. Tratamento para Sanfonas baseadas em div/button (Plugins / Custom)
    if (details || accordionItem) {
        const item = details || accordionItem;
        e.preventDefault();
        const isOpen = item.classList.contains('is-open') || item.hasAttribute('open');

        if (isOpen) {
            item.classList.remove('is-open');
            item.removeAttribute('open');
        } else {
            item.classList.add('is-open');
            item.setAttribute('open', 'true');
        }

        const content = item.querySelector('.accordion-content, .wp-block-accordion__content, .uagb-faq-content, .uagb-accordion-content, .kt-accordion-panel, .su-spoiler-content, .faq-answer, .wp-block-details__content')
                     || Array.from(item.children).find(child => child !== trigger && !child.contains(trigger));

        if (content && content !== trigger) {
            content.style.display = isOpen ? 'none' : 'block';
        }
    }
});

