// frontend/assets/js/api.js
class MangoAPI {
  constructor() {
    this.baseUrl = window.location.hostname === 'localhost' ? 
      'http://localhost:5000/api' : 
      '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.defaultHeaders,
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
          }
          throw new Error('No autorizado');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error GET ${endpoint}:`, error);
      throw error;
    }
  }

  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.defaultHeaders,
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error POST ${endpoint}:`, error);
      throw error;
    }
  }

  // Métodos específicos para el proyecto
  async getSensorData() {
    return this.get('/sensors/all');
  }

  async login(username, password) {
    return this.post('/auth/login', { username, password });
  }

  async logout() {
    return this.post('/auth/logout', {});
  }

  async checkAuthStatus() {
    return this.get('/auth/status');
  }
}

// Exportar instancia singleton
const mangoAPI = new MangoAPI();
window.mangoAPI = mangoAPI;