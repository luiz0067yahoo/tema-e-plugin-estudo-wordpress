/**
 * API Service for Tema Estudo React
 * Consumes Plugin Estudo custom REST endpoints and WP core endpoints.
 */

const getBaseConfig = () => {
  if (typeof window !== 'undefined' && window.EstudoApiConfig) {
    return window.EstudoApiConfig;
  }
  return {
    apiUrl: 'https://luizbrogliatto.freedev.app/wp-json/api/v1/',
    wpRestUrl: 'https://luizbrogliatto.freedev.app/wp-json/',
    nonce: '',
    siteName: 'Tema Estudo',
    description: 'Frontend Moderno em React',
    homeUrl: '/',
  };
};

class ApiService {
  constructor() {
    this.config = getBaseConfig();
    this.tokenKey = 'estudo_jwt_token';
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.config.nonce) {
      headers['X-WP-Nonce'] = this.config.nonce;
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  buildUrl(base, endpoint) {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    let baseUrl = base.endsWith('/') ? base : `${base}/`;

    if (baseUrl.includes('?')) {
      if (cleanEndpoint.includes('?')) {
        cleanEndpoint = cleanEndpoint.replace('?', '&');
      }
      return `${baseUrl}${cleanEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
    }

    return `${baseUrl}${cleanEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
  }

  async request(endpoint, options = {}) {
    this.config = getBaseConfig();
    const url = this.buildUrl(this.config.apiUrl, endpoint);

    try {
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(options.headers || {}),
      });

      if (!response.ok) {
        // Tenta endpoint de fallback do WP se o endpoint customizado retornar 404
        if (response.status === 404 && endpoint.includes('categories')) {
          return this.fallbackWpCategories();
        }
        if (response.status === 404 && endpoint.includes('posts')) {
          return this.fallbackWpPosts(endpoint);
        }
        if (response.status === 404 && endpoint.includes('pages')) {
          return this.fallbackWpPages(endpoint);
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`[API] Falha em ${endpoint}:`, err.message);
      throw err;
    }
  }

  async fallbackWpCategories() {
    const url = this.buildUrl(this.config.wpRestUrl, 'wp/v2/categories?per_page=100');
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async fallbackWpPosts(endpoint) {
    const query = endpoint.includes('?') ? endpoint.substring(endpoint.indexOf('?')) : '';
    const url = this.buildUrl(this.config.wpRestUrl, `wp/v2/posts${query}`);
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async fallbackWpPages(endpoint) {
    try {
      const query = endpoint.includes('?') ? endpoint.substring(endpoint.indexOf('?')) : '';
      const url = this.buildUrl(this.config.wpRestUrl, `wp/v2/pages${query}`);
      const res = await fetch(url, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data)
        ? data.map((p) => ({
            id: p.id,
            name: p.title?.rendered || p.title || '',
            slug: p.slug,
            description: p.content?.rendered || p.content || '',
            short_description: p.excerpt?.rendered || p.excerpt || '',
            thumbnail: p._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
          }))
        : [];
    } catch {
      return [];
    }
  }

  async getSiteSettings() {
    try {
      const data = await this.request('settings');
      return data && data.data ? data.data : data;
    } catch {
      return {
        site_name: this.config.siteName,
        site_description: this.config.description,
      };
    }
  }

  async getCategories() {
    try {
      // Consome a rota customizada solicitada: /wp-json/api/v1/categories
      const data = await this.request('categories?per_page=100');
      const cats = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
      if (cats && cats.length > 0) {
        return cats
          .map((c) => ({
            id: c.id || c.term_id,
            name: c.name || c.title || 'Categoria',
            slug: c.slug || '',
            count: typeof c.count !== 'undefined' ? Number(c.count) : 0,
            parent: typeof c.parent !== 'undefined' ? Number(c.parent) : 0,
            description: c.description || '',
            thumbnail: c.thumbnail || null,
          }))
          .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
      }
    } catch (err) {
      console.warn('[API] getCategories falhou na URL base, tentando diretamente na rota pública:', err.message);
      try {
        const directRes = await fetch('https://luizbrogliatto.freedev.app/wp-json/api/v1/categories');
        if (directRes.ok) {
          const directData = await directRes.json();
          const cats = Array.isArray(directData) ? directData : (directData && Array.isArray(directData.data) ? directData.data : []);
          if (cats && cats.length > 0) {
            return cats
              .map((c) => ({
                id: c.id || c.term_id,
                name: c.name || c.title || 'Categoria',
                slug: c.slug || '',
                count: typeof c.count !== 'undefined' ? Number(c.count) : 0,
                parent: typeof c.parent !== 'undefined' ? Number(c.parent) : 0,
                description: c.description || '',
                thumbnail: c.thumbnail || null,
              }))
              .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
          }
        }
      } catch (fallbackErr) {
        console.warn('[API] Fallback direto falhou:', fallbackErr.message);
      }
    }

    // Se o WordPress forneceu categorias em EstudoApiConfig, usa-as diretamente
    if (typeof window !== 'undefined' && window.EstudoApiConfig?.categories?.length > 0) {
      return window.EstudoApiConfig.categories;
    }

    // Fallback com as categorias reais da API caso esteja rodando totalmente offline
    return [
      { id: 12, name: 'Home', slug: 'home', count: 0, parent: 0 },
      { id: 13, name: 'Produtos', slug: 'produtos', count: 0, parent: 0 },
      { id: 14, name: 'Serviços', slug: 'servicos', count: 0, parent: 0 },
      { id: 15, name: 'Fotos', slug: 'fotos', count: 0, parent: 0 },
      { id: 16, name: 'Vídeos', slug: 'videos', count: 0, parent: 0 },
      { id: 17, name: 'Contato', slug: 'contato', count: 0, parent: 0 },
    ];
  }

  async getTopMenuCategories() {
    // 1. Tenta obter do objeto injetado pelo WordPress no HTML
    if (
      typeof window !== 'undefined' &&
      Array.isArray(window.EstudoApiConfig?.topMenuCategories) &&
      window.EstudoApiConfig.topMenuCategories.length > 0
    ) {
      return window.EstudoApiConfig.topMenuCategories;
    }

    // 2. Consulta a rota customizada da API de menu de categorias
    try {
      const data = await this.request('menu-categories');
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
      if (list && list.length > 0) return list;
    } catch {
      // Ignora e tenta fallback
    }

    try {
      const directRes = await fetch(this.buildUrl(this.config.wpRestUrl, 'tema-estudo/v1/menu-categories'));
      if (directRes.ok) {
        const list = await directRes.json();
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch {}

    return [];
  }

  async getPages(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      const data = await this.request(`pages${query ? `?${query}` : ''}`);
      return Array.isArray(data) ? data : (data && data.data ? data.data : []);
    } catch {
      return [];
    }
  }

  async getPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      const data = await this.request(`posts${query ? `?${query}` : ''}`);
      return Array.isArray(data) ? data : (data && data.data ? data.data : []);
    } catch {
      return [];
    }
  }

  async getPostById(id) {
    try {
      const data = await this.request(`posts/${id}`);
      return data && data.data ? data.data : data;
    } catch {
      return null;
    }
  }

  async searchAll(searchTerm = '') {
    const term = searchTerm.trim();
    if (!term) return [];

    try {
      // Busca simultaneamente posts e páginas
      const [postsRes, pagesRes] = await Promise.allSettled([
        this.getPosts({ search: term }),
        this.getPages({ search: term }),
      ]);

      const postsList = postsRes.status === 'fulfilled' && Array.isArray(postsRes.value) ? postsRes.value : [];
      const pagesList = pagesRes.status === 'fulfilled' && Array.isArray(pagesRes.value) ? pagesRes.value : [];

      const formattedPages = pagesList.map((p) => ({
        ...p,
        type: 'page',
      }));

      // Combina e remove duplicatas por slug ou id
      const combined = [...postsList];
      const seenKeys = new Set(postsList.map((item) => `${item.type || 'post'}-${item.slug || item.id}`));

      for (const page of formattedPages) {
        const key = `page-${page.slug || page.id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          combined.push(page);
        }
      }

      // Ordena todos os conteúdos relacionados por data decrescente (mais recentes primeiro)
      combined.sort((a, b) => {
        const dateA = new Date(a.date_created || a.post_date || a.date || 0).getTime();
        const dateB = new Date(b.date_created || b.post_date || b.date || 0).getTime();
        return dateB - dateA;
      });

      return combined;
    } catch (err) {
      console.warn('[API] Erro ao pesquisar:', err);
      return [];
    }
  }

  async login(username, password) {
    const data = await this.request('auth', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    const token = data.token || (data.data && data.data.token);
    if (token) {
      this.setToken(token);
    }
    return data;
  }

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

export const api = new ApiService();
export default api;
