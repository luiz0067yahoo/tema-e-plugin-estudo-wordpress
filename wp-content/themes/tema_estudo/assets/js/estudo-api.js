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
 * Load Posts Grid dynamically into index / archive templates
 */
async function initPostsFeed() {
    const container = document.getElementById('api-posts-container');
    if (!container) return;

    container.innerHTML = '<div class="api-loading">Carregando publicações...</div>';

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const catId = urlParams.get('category');
        const params = catId ? { category: catId } : {};

        const posts = await window.estudoAPI.getPosts(params);

        if (!posts || (Array.isArray(posts) && posts.length === 0)) {
            container.innerHTML = '<p class="api-empty">Nenhum post encontrado.</p>';
            return;
        }

        const postsArray = Array.isArray(posts) ? posts : [posts];

        container.innerHTML = postsArray.map(post => `
            <article class="api-post-card">
                ${post.featured_image ? `<img src="${post.featured_image}" class="api-post-thumb" alt="${post.post_title || post.title || ''}" />` : ''}
                <h3 class="api-post-title">
                    <a href="?post_id=${post.ID || post.id}">${post.post_title || post.title || 'Sem título'}</a>
                </h3>
                <div class="api-post-excerpt">
                    ${post.post_excerpt || post.excerpt || (post.post_content ? post.post_content.substring(0, 120) + '...' : '')}
                </div>
                <div class="api-post-meta">
                    <span>Data: ${post.post_date ? new Date(post.post_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
                </div>
            </article>
        `).join('');

    } catch (err) {
        container.innerHTML = `<div class="api-error">Falha ao carregar posts via REST API. (${err.message})</div>`;
    }
}

/**
 * Load Categories List
 */
async function initCategoriesList() {
    const container = document.getElementById('api-categories-container');
    if (!container) return;

    try {
        const categories = await window.estudoAPI.getCategories();
        if (!categories || !Array.isArray(categories)) return;

        container.innerHTML = `
            <ul class="api-cat-list">
                <li><a href="${window.location.pathname}">Todas as Categorias</a></li>
                ${categories.map(cat => `
                    <li><a href="?category=${cat.term_id || cat.id}">${cat.name} (${cat.count || 0})</a></li>
                `).join('')}
            </ul>
        `;
    } catch (err) {
        console.warn('Erro ao carregar categorias:', err);
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
