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

    // Obtener datos para gráficos
    const weeklyData = await api.getWeeklySummary();
    const streakData = await this.getStreakData();
    const statusDistribution = await this.getStatusDistribution();
    const monthlyTrend = await this.getMonthlyTrend();

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
          <div class="header-actions">
            <button id="refresh-btn" class="btn btn-secondary">
              <i class="fas fa-sync-alt"></i> Actualizar
            </button>
            <button id="logout-btn" class="btn btn-secondary">
              <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
            </button>
          </div>
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

        <!-- Pestañas -->
        <div class="tabs-container">
          <div class="tabs-header">
            <button id="tab-habits-btn" class="tab-btn active" data-tab="habits">
              <i class="fas fa-robot"></i> Mis Hábitos
            </button>
            <button id="tab-charts-btn" class="tab-btn" data-tab="charts">
              <i class="fas fa-chart-line"></i> Gráficos
            </button>
          </div>

          <!-- Tab: Hábitos -->
          <div id="tab-habits" class="tab-content active">
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

          <!-- Tab: Gráficos -->
          <div id="tab-charts" class="tab-content">
            <div class="charts-grid">
              <!-- Gráfico Semanal -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3><i class="fas fa-calendar-week"></i> Progreso Semanal</h3>
                  <span class="chart-subtitle">Últimos 7 días</span>
                </div>
                <div class="chart-container">
                  <canvas id="weeklyChart"></canvas>
                </div>
              </div>

              <!-- Gráfico de Distribución -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3><i class="fas fa-chart-pie"></i> Distribución de Estados</h3>
                  <span class="chart-subtitle">Esta semana</span>
                </div>
                <div class="chart-container">
                  <canvas id="statusChart"></canvas>
                </div>
              </div>

              <!-- Gráfico de Racha -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3><i class="fas fa-fire"></i> Racha de Hábitos</h3>
                  <span class="chart-subtitle">Últimos 30 días</span>
                </div>
                <div class="chart-container">
                  <canvas id="streakChart"></canvas>
                </div>
              </div>

              <!-- Gráfico de Tendencia -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3><i class="fas fa-chart-area"></i> Tendencia Mensual</h3>
                  <span class="chart-subtitle">Últimos 30 días</span>
                </div>
                <div class="chart-container">
                  <canvas id="monthlyChart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // ✅ Inicializar gráficos
    setTimeout(() => {
      this.initCharts(weeklyData, statusDistribution, streakData, monthlyTrend);
    }, 100);

    // ✅ Agregar event listeners
    document.getElementById('logout-btn').addEventListener('click', () => {
      auth.logout();
    });

    document.getElementById('new-habit-btn').addEventListener('click', () => {
      habits.showCreateModal();
    });

    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.refresh();
    });

    // ✅ Event listeners para pestañas
    document.getElementById('tab-habits-btn').addEventListener('click', () => {
      this.switchTab('habits');
    });

    document.getElementById('tab-charts-btn').addEventListener('click', () => {
      this.switchTab('charts');
    });

    this.renderHabits();

  } catch (error) {
    console.error('Error cargando dashboard:', error);
    this.showError('Error al cargar el dashboard');
  }
}

/**
 * Cambiar entre pestañas
 */
switchTab(tabName) {
  // Actualizar botones
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Actualizar contenido
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

/**
 * Inicializar todos los gráficos
 */
initCharts(weeklyData, statusData, streakData, monthlyData) {
  // 1. Gráfico semanal
  if (weeklyData.data && weeklyData.data.dailyStats) {
    charts.createWeeklyChart('weeklyChart', weeklyData.data.dailyStats);
  }

  // 2. Gráfico de distribución
  if (statusData && statusData.length > 0) {
    charts.createStatusChart('statusChart', statusData);
  }

  // 3. Gráfico de racha
  if (streakData && streakData.length > 0) {
    charts.createStreakChart('streakChart', streakData);
  }

  // 4. Gráfico de tendencia mensual
  if (monthlyData && monthlyData.length > 0) {
    charts.createMonthlyChart('monthlyChart', monthlyData);
  }
}

/**
 * Obtener datos de distribución de estados
 */
async getStatusDistribution() {
  try {
    const weeklyData = await api.getWeeklySummary();
    if (!weeklyData.data || !weeklyData.data.dailyStats) return [];

    const statusCount = {
      COMPLETED: 0,
      SKIPPED: 0,
      FAILED: 0,
      PENDING: 0
    };

    weeklyData.data.dailyStats.forEach(day => {
      day.logs.forEach(log => {
        if (statusCount[log.status] !== undefined) {
          statusCount[log.status]++;
        }
      });
    });

    // Calcular pendientes
    const totalHabits = weeklyData.data.summary.totalHabits;
    const totalLogged = Object.values(statusCount).reduce((a, b) => a + b, 0);
    const totalPossible = totalHabits * 7;
    statusCount.PENDING = totalPossible - totalLogged;

    return Object.keys(statusCount).map(status => ({
      status,
      count: statusCount[status]
    })).filter(d => d.count > 0);

  } catch (error) {
    console.error('Error getting status distribution:', error);
    return [];
  }
}

/**
 * Obtener datos de racha para gráfico
 */
async getStreakData() {
  try {
    // Simular datos de racha (en producción, obtener del backend)
    const today = new Date();
    const data = [];
    let streak = 0;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simular racha (alternar para demo)
      if (i % 3 === 0) {
        streak = 0;
      } else {
        streak++;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        streak: streak
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error getting streak data:', error);
    return [];
  }
}

/**
 * Obtener datos de tendencia mensual
 */
async getMonthlyTrend() {
  try {
    // Simular datos mensuales (en producción, obtener del backend)
    const today = new Date();
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const completed = Math.floor(Math.random() * 5);
      const total = 5;
      const rate = Math.round((completed / total) * 100);
      
      data.push({
        date: date.toISOString().split('T')[0],
        completed: completed,
        total: total,
        rate: rate
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error getting monthly trend:', error);
    return [];
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