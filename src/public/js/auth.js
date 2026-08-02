/**
 * Módulo de autenticación
 */
class AuthModule {
  constructor() {
    this.isAuthenticated = !!localStorage.getItem('token');
    this.user = null;
  }

  /**
   * Renderizar página de login
   */
  renderLogin() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="auth-container">
        <div class="auth-box">
          <div class="auth-header">
            <h1>Habit Tracker</h1>
            <p>Inicia sesión para continuar</p>
          </div>
          
          <form id="login-form">
            <div class="form-group">
              <label for="login-email">Email</label>
              <input type="email" id="login-email" placeholder="tu@email.com" required />
            </div>
            <div class="form-group">
              <label for="login-password">Contraseña</label>
              <input type="password" id="login-password" placeholder="••••••••" required />
            </div>
            <div id="login-error" class="error-message" style="display:none;"></div>
            <button type="submit" class="btn btn-primary btn-full">Iniciar Sesión</button>
          </form>
          
          <div class="auth-footer">
            <p>¿No tienes cuenta? <a href="#register">Regístrate aquí</a></p>
          </div>
        </div>
      </div>
    `;

    // Event listener del formulario
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
  }

  /**
   * Renderizar página de registro
   */
  renderRegister() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="auth-container">
        <div class="auth-box">
          <div class="auth-header">
            <h1>Habit Tracker</h1>
            <p>Crea tu cuenta gratuita</p>
          </div>
          
          <form id="register-form">
            <div class="form-group">
              <label for="register-name">Nombre</label>
              <input type="text" id="register-name" placeholder="Tu nombre" required />
            </div>
            <div class="form-group">
              <label for="register-email">Email</label>
              <input type="email" id="register-email" placeholder="tu@email.com" required />
            </div>
            <div class="form-group">
              <label for="register-password">Contraseña</label>
              <input type="password" id="register-password" placeholder="Mínimo 6 caracteres" required />
              <small>Debe tener al menos 6 caracteres, una mayúscula y un número</small>
            </div>
            <div id="register-error" class="error-message" style="display:none;"></div>
            <button type="submit" class="btn btn-primary btn-full">Registrarse</button>
          </form>
          
          <div class="auth-footer">
            <p>¿Ya tienes cuenta? <a href="#login">Inicia sesión</a></p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });
  }

  /**
   * Manejar login
   */
  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
      errorEl.style.display = 'none';
      const response = await api.login({ email, password });
      
      if (response.success) {
        api.setToken(response.data.token);
        this.isAuthenticated = true;
        this.user = response.data.user;
        window.location.hash = '#dashboard';
        renderApp();
      }
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.style.display = 'block';
    }
  }

  /**
   * Manejar registro
   */
  async handleRegister() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorEl = document.getElementById('register-error');

    try {
      errorEl.style.display = 'none';
      const response = await api.register({ name, email, password });
      
      if (response.success) {
        api.setToken(response.data.token);
        this.isAuthenticated = true;
        this.user = response.data.user;
        window.location.hash = '#dashboard';
        renderApp();
      }
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.style.display = 'block';
    }
  }

  /**
   * Cerrar sesión
   */
  logout() {
    api.setToken(null);
    this.isAuthenticated = false;
    this.user = null;
    window.location.hash = '#login';
    renderApp();
  }

  /**
   * Verificar si está autenticado
   */
  checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      this.isAuthenticated = true;
      api.setToken(token);
      return true;
    }
    this.isAuthenticated = false;
    return false;
  }
}

// Instancia global
const auth = new AuthModule();