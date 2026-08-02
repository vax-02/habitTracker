/**
 * Módulo de Dashboard
 */
class DashboardModule {
  constructor() {
    this.habits = [];
    this.dashboardData = null;

  }

  /**
   * Renderizar dashboard
   */
  async render() {
  try {
    const dashboardData = await api.getDashboard();
    this.dashboardData = dashboardData.data;
    
    const habitsData = await api.getHabits();
    this.habits = habitsData.data;

    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="dashboard-container">
        <!-- Header -->
        <div class="dashboard-header">
          <div>
            <h1><i class="fas fa-chart-pie" style="color: var(--primary);"></i> Tu Dashboard</h1>
            <p class="subtitle">
              <i class="far fa-calendar-alt"></i> 
              ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button id="logout-btn" class="btn btn-secondary">
            <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
          </button>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-list-check"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">${dashboardData.data.summary.totalHabits}</span>
              <span class="stat-label"><i class="fas fa-tasks"></i> Total Hábitos</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-check-circle" style="color: var(--success);"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">${dashboardData.data.summary.completedToday}</span>
              <span class="stat-label"><i class="fas fa-check"></i> Completados Hoy</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-fire" style="color: #f59e0b;"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">${dashboardData.data.summary.globalStreak}</span>
              <span class="stat-label"><i class="fas fa-fire"></i> Racha Actual</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-chart-line" style="color: #6366f1;"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">${dashboardData.data.summary.completionRate}%</span>
              <span class="stat-label"><i class="fas fa-percent"></i> Tasa de Completado</span>
            </div>
          </div>
        </div>

        <!-- Hábitos -->
        <div class="habits-section">
          <div class="section-header">
            <h2><i class="fas fa-robot"></i> Tus Hábitos</h2>
            <button id="new-habit-btn" class="btn btn-primary">
              <i class="fas fa-plus-circle"></i> Nuevo Hábito
            </button>
          </div>
          <div id="habits-list" class="habits-list"></div>
        </div>
      </div>
    `;

    // Agregar event listeners en lugar de onclick
    document.getElementById('logout-btn').addEventListener('click', () => {
      auth.logout();
    });
/*
    document.getElementById('').addEventListener('click',()=>{
      habits.closeModal();
    })*/

    document.getElementById('new-habit-btn').addEventListener('click', () => {
      habits.showCreateModal();
    });

    this.renderHabits();
    this.loadWeeklyData();

  } catch (error) {
    console.error('Error cargando dashboard:', error);
    this.showError('Error al cargar el dashboard');
  }
}

renderHabits() {
  const container = document.getElementById('habits-list');
  
  if (this.habits.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p><i class="fas fa-robot"></i> No tienes hábitos aún</p>
        <p class="empty-subtitle"><i class="fas fa-plus-circle"></i> ¡Crea tu primer hábito para empezar!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = this.habits.map(habit => {
    const statusIcons = {
      'COMPLETED': '<i class="fas fa-check-circle" style="color: var(--success);"></i>',
      'SKIPPED': '<i class="fas fa-clock" style="color: var(--warning);"></i>',
      'FAILED': '<i class="fas fa-times-circle" style="color: var(--danger);"></i>',
      'PENDING': '<i class="fas fa-hourglass-half" style="color: var(--text-light);"></i>'
    };
    
    const statusText = {
      'COMPLETED': 'Completado',
      'SKIPPED': 'Saltado',
      'FAILED': 'Fallido',
      'PENDING': 'Pendiente'
    };

    const todayStatus = habit.todayStatus || 'PENDING';
    const statusIcon = statusIcons[todayStatus] || statusIcons['PENDING'];
    const statusLabel = statusText[todayStatus] || statusText['PENDING'];

    return `
      <div class="habit-card" data-id="${habit.id}">
        <div class="habit-header">
          <div class="habit-info">
            <div class="habit-icon">
              <i class="${habit.icon || 'fas fa-check'}"></i>
            </div>
            <div>
              <h3 class="habit-name">${habit.name}</h3>
              <p class="habit-description">${habit.description || 'Sin descripción'}</p>
              <div class="habit-status ${todayStatus.toLowerCase()}">
                ${statusIcon} ${statusLabel}
              </div>
            </div>
          </div>
          <div class="habit-actions">
            <button class="btn btn-success btn-sm log-btn" data-id="${habit.id}">
              <i class="fas fa-check"></i>
              ${todayStatus === 'COMPLETED' ? 'Completado' : 'Registrar'}
            </button>
            <button class="btn btn-secondary btn-sm edit-btn" data-id="${habit.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${habit.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="habit-metrics">
          <span><i class="fas fa-chart-bar"></i> ${habit.metrics?.completionRate || 0}% completado</span>
          <span><i class="fas fa-fire"></i> ${habit.metrics?.currentStreak || 0} días de racha</span>
          <span><i class="fas fa-list"></i> ${habit.metrics?.totalLogs || 0} registros</span>
        </div>
      </div>
    `;
  }).join('');

  // ✅ Agregar event listeners para los botones de hábitos
  container.querySelectorAll('.log-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      habits.logToday(parseInt(btn.dataset.id));
    });
  });

  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      habits.showEditModal(parseInt(btn.dataset.id));
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      habits.deleteHabit(parseInt(btn.dataset.id));
    });
  });
}

  /**
   * Cargar datos semanales
   */
  async loadWeeklyData() {
    try {
      const weeklyData = await api.getWeeklySummary();
      console.log('Datos semanales:', weeklyData);
    } catch (error) {
      console.error('Error cargando datos semanales:', error);
    }
  }

  /**
   * Mostrar mensaje de error
   */
  showError(message) {
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="error-page">
        <p>❌ ${message}</p>
        <button id="retry-btn" class="btn btn-primary">Intentar de nuevo</button>
      </div>
    `;

    document.getElementById('retry-btn').addEventListener('click', () => {
      renderApp();
    });
  }

  /**
   * Actualizar el dashboard (refresh)
   */
  async refresh() {
    await this.render();
  }
}

// Instancia global
const dashboard = new DashboardModule();