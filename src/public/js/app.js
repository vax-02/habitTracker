/**
 * Controlador principal de la aplicación SPA
 */
function renderApp() {
  const hash = window.location.hash || '#login';
  
  const isAuth = auth.checkAuth();

  if (!isAuth) {
    if (hash === '#register') {
      auth.renderRegister();
    } else {
      auth.renderLogin();
    }
    return;
  }

  if (hash !== '#dashboard') {
    charts.destroyAll();
  }


  switch (hash) {
    case '#dashboard':
      dashboard.render();
      break;
    case '#habits':
      dashboard.render();
      break;
    case '#reminders':
      reminders.render();
      break;
    default:
      dashboard.render();
  }
}

// Escuchar cambios en la URL
window.addEventListener('hashchange', renderApp);

// ✅ Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar tema (claro/oscuro) desde cookie
  theme.init();
  renderApp();

  // Inicializar push notifications si el usuario está autenticado
  if (auth.checkAuth()) {
    pushModule.init();
  }
});
