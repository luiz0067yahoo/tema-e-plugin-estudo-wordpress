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
        const url = `${this.config.apiUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
        
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
            console.error(`[API Estudo Error] Endpoint: ${endpoint}`, error.message);
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

    // Get Categories
    async getCategories() {
        return await this.request('categories', { method: 'GET' });
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
 * Load Site Settings dynamically into Header / Footer slots
 */
async function initSiteSettings() {
    const titleEl = document.getElementById('api-site-title');
    const descEl = document.getElementById('api-site-description');

    if (!titleEl && !descEl) return;

    try {
        const settings = await window.estudoAPI.getSettings();
        if (titleEl && settings.title) titleEl.textContent = settings.title;
        if (descEl && settings.description) descEl.textContent = settings.description;
    } catch (err) {
        console.warn('Nao foi possivel carregar configurações via API:', err);
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
        const categories = await window.estudoAPI.getCategories();
        if (!categories || !Array.isArray(categories)) return;

        const currentCatSlug = getCurrentCategoryFromURL(categories);

        // Render Header Main Navigation Menu with verbose category slugs (/minhacategoria)
        if (headerNav) {
            headerNav.innerHTML = `
                <a href="/" class="nav-item ${!currentCatSlug ? 'active' : ''}">Home</a>
                ${categories.map(cat => {
                    const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
                    const isActive = currentCatSlug === slug;
                    return `<a href="/${slug}" class="nav-item ${isActive ? 'active' : ''}">${cat.name}</a>`;
                }).join('')}
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

/**
 * Load Category Page content (first) if present, then load Posts Grid (320px fluid layout)
 */
async function initPostsFeed() {
    const postsContainer = document.getElementById('api-posts-container');
    const categoryPageContainer = document.getElementById('api-category-page-container');
    const sectionTitle = document.getElementById('api-section-title');

    if (!postsContainer) return;

    postsContainer.innerHTML = '<div class="api-loading">Carregando publicações...</div>';
    if (categoryPageContainer) categoryPageContainer.innerHTML = '';

    try {
        let categories = [];
        try {
            categories = await window.estudoAPI.getCategories();
        } catch (e) {
            categories = [];
        }

        const currentCatSlug = getCurrentCategoryFromURL(categories);
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
            postsContainer.innerHTML = '<p class="api-empty">Nenhum post encontrado nesta categoria.</p>';
            return;
        }

        postsContainer.innerHTML = posts.map(post => {
            const postId = post.id || post.ID;
            const postTitle = post.name || post.post_title || post.title || 'Sem título';
            const thumbUrl = post.thumbnail || post.featured_image || (post.images && post.images.length > 0 ? post.images[0].src : '');
            const rawContent = post.description || post.post_content || '';
            const excerpt = post.short_description || post.post_excerpt || (rawContent ? rawContent.replace(/<[^>]+>/g, '').substring(0, 110) + '...' : '');
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
                        ${excerpt ? `<div class="api-post-excerpt">${excerpt}</div>` : ''}
                        <div class="api-post-meta">
                            <span>Data: ${dateFormatted}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

    } catch (err) {
        postsContainer.innerHTML = `<div class="api-error">Falha ao carregar conteúdo via REST API. (${err.message})</div>`;
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
        container.innerHTML = '<p class="api-error">ID de publicação não especificado.</p>';
        return;
    }

    container.innerHTML = '<div class="api-loading">Carregando artigo...</div>';

    try {
        const post = await window.estudoAPI.getPostById(postId);
        
        if (!post) {
            container.innerHTML = '<p class="api-empty">Publicação não encontrada.</p>';
            return;
        }

        container.innerHTML = `
            <article class="api-single-article">
                <h1 class="api-single-title">${post.post_title || post.title || 'Sem título'}</h1>
                <div class="api-single-meta">
                    Publicado em: ${post.post_date ? new Date(post.post_date).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
                ${post.featured_image ? `<img src="${post.featured_image}" class="api-single-thumb" alt="" />` : ''}
                <div class="api-single-content">
                    ${post.post_content || post.content || ''}
                </div>
                <div class="api-back-link">
                    <a href="javascript:history.back()">&larr; Voltar para a lista</a>
                </div>
            </article>
        `;
    } catch (err) {
        container.innerHTML = `<div class="api-error">Erro ao carregar post: ${err.message}</div>`;
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
