/**
 * Cliente API para comunicación con el backend
 */
class API {
  constructor() {
    this.baseURL = window.location.origin;
    this.token = localStorage.getItem('token');
  }

  /**
   * Configurar el token de autenticación
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  /**
   * Obtener headers para las peticiones
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Manejar errores de respuesta
   */
  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      // Si el token expiró, redirigir a login
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('token');
        window.location.hash = '#login';
        throw new Error('Sesión expirada');
      }
      throw new Error(data.message || 'Error en la petición');
    }
    return data;
  }

  /**
   * GET request
   */
  async get(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // ============================================
  // MÉTODOS ESPECÍFICOS DE LA API
  // ============================================

  // Auth
  async register(data) {
    return this.post('/api/auth/register', data);
  }

  async login(data) {
    return this.post('/api/auth/login', data);
  }

  async getProfile() {
    return this.get('/api/auth/profile');
  }

  // Habits
  async getHabits(params = '') {
    return this.get(`/api/habits${params}`);
  }

  async createHabit(data) {
    return this.post('/api/habits', data);
  }

  async updateHabit(id, data) {
    return this.put(`/api/habits/${id}`, data);
  }

  async deleteHabit(id) {
    return this.delete(`/api/habits/${id}`);
  }

  // Logs
  async logHabit(id, data) {
    return this.post(`/api/habits/${id}/log`, data);
  }

  async getHabitLogs(id, params = '') {
    return this.get(`/api/habits/${id}/logs${params}`);
  }

  // Dashboard
  async getDashboard() {
    return this.get('/api/dashboard');
  }

  async getWeeklySummary() {
    return this.get('/api/dashboard/weekly');
  }

  async getStreak() {
    return this.get('/api/dashboard/streak');
  }
}

// Instancia global
const api = new API();