/**
 * API Service for Tema Estudo React
 * Consumes Plugin Estudo custom REST endpoints and WP core endpoints.
 */

const getBaseConfig = () => {
  if (typeof window !== 'undefined' && window.EstudoApiConfig) {
    return window.EstudoApiConfig;
  }
  return {
    apiUrl: '/wp-json/api/v1/',
    wpRestUrl: '/wp-json/',
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

  async request(endpoint, options = {}) {
    this.config = getBaseConfig();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const base = this.config.apiUrl.endsWith('/') ? this.config.apiUrl : `${this.config.apiUrl}/`;
    const url = `${base}${cleanEndpoint}`;

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
    const res = await fetch(`${this.config.wpRestUrl}wp/v2/categories?per_page=100`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async fallbackWpPosts(endpoint) {
    const res = await fetch(`${this.config.wpRestUrl}wp/v2/posts?_embed`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
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
      const data = await this.request('categories');
      const cats = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
      return cats.map(c => ({
        id: c.id || c.term_id,
        name: c.name || c.title || 'Categoria',
        slug: c.slug || '',
        count: c.count || 0,
      }));
    } catch {
      return [];
    }
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
