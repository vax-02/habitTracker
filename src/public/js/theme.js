/**
 * Módulo de tema (claro/oscuro) con persistencia en cookie
 */
class ThemeModule {
  constructor() {
    this.THEME_COOKIE = 'habit_tracker_theme';
    this.currentTheme = this.getCookie(this.THEME_COOKIE) || 'light';
  }

  /**
   * Obtener valor de una cookie
   */
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * Guardar valor en cookie (30 días de expiración)
   */
  setCookie(name, value, days = 30) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  /**
   * Aplicar el tema actual al documento
   */
  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    this.updateToggleIcon();
  }

  /**
   * Cambiar entre tema claro y oscuro
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setCookie(this.THEME_COOKIE, this.currentTheme);
    this.applyTheme();
  }

  /**
   * Actualizar el icono del botón de tema
   */
  updateToggleIcon() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.innerHTML = this.currentTheme === 'dark'
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
      toggleBtn.title = this.currentTheme === 'dark'
        ? 'Cambiar a tema claro'
        : 'Cambiar a tema oscuro';
    }
  }

  /**
   * Crear el botón de cambio de tema
   */
  renderToggle() {
    // Eliminar botón existente si lo hay
    const existing = document.getElementById('theme-toggle');
    if (existing) existing.remove();

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle';
    toggleBtn.className = 'theme-toggle';
    toggleBtn.setAttribute('aria-label', 'Cambiar tema');
    toggleBtn.addEventListener('click', () => this.toggleTheme());
    document.body.appendChild(toggleBtn);

    this.updateToggleIcon();
  }

  /**
   * Inicializar el módulo de tema
   */
  init() {
    this.applyTheme();
    this.renderToggle();
  }
}

// Instancia global
const theme = new ThemeModule();