const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn('⚠️ VITE_API_BASE_URL is not defined');
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  get token() {
    return localStorage.getItem('access_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  clearToken() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUser');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    // If we're not sending FormData (like file uploads), default to JSON
    if (!(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);

      console.log(`[API] ${options.method || 'GET'} ${endpoint} -> ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
        }

        let message = `HTTP Error ${response.status}`;

        try {
          const data = await response.json();
          message = data?.detail || message;
        } catch {
          // ignore
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
      }

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return null;

    } catch (error) {
      console.error('[API] Request failed:', error);
      throw error;
    }
  }

  async getProducts(params = {}) {
    const searchParams = new URLSearchParams(params);

    const endpoint = `/products${searchParams.toString() ? '?' + searchParams : ''}`;

    return this.request(endpoint);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.request('/products/', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getProductTypes() {
    return this.request('/products/types/list');
  }

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/products/upload-image', {
      method: 'POST',
      body: formData,
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.access_token) {
      this.setToken(response.access_token);

      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
    }

    return response;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async getUsers() {
    return this.request('/admin/users');
  }

  async getAdminStats() {
    return this.request('/admin/stats');
  }

  transformProduct(product) {
    return {
      id: product.id,
      name: product.name,
      price:
        typeof product.price === 'number'
          ? product.price.toFixed(2)
          : product.price,
      type: product.type,
      img: product.image_url,
      isNew: product.is_new,
      description: product.description,
      stock: product.stock,
    };
  }

  transformProductList(products) {
    if (!Array.isArray(products)) return [];

    return products.map(p => this.transformProduct(p));
  }
}

export default new ApiService();
