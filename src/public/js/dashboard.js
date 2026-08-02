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
    const statusDistribution = await this.getStatusDistribution();
    const streakData = await this.getStreakData();
    const monthlyTrend = await this.getMonthlyTrend();

    // Obtener recordatorios
    const remindersData = await api.get('/api/reminders');
    this.reminders = remindersData.data || [];

    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="dashboard-container">
        <!-- Header -->
        <div class="dashboard-header">
          <div>
            <h1><i class="fas fa-chart-pie" style="color: var(--primary);"></i> Tu Dashboard</h1>
            <p class="subtitle">
              <i class="far fa-calendar-alt"></i> 
              <span id="clock-date">${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
          <div class="header-actions">
            <div class="clock-display" title="Hora del servidor">
              <i class="fas fa-clock"></i>
              <span id="clock-time">--:--:--</span>
            </div>
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
            <button id="tab-reminders-btn" class="tab-btn" data-tab="reminders">
              <i class="fas fa-bell"></i> Recordatorios
              ${this.reminders.filter(r => r.active).length > 0 ? `<span class="badge-small">${this.reminders.filter(r => r.active).length}</span>` : ''}
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

          <!-- Tab: Recordatorios -->
          <div id="tab-reminders" class="tab-content">
            <div class="reminders-section">
              <div class="section-header">
                <h2><i class="fas fa-bell"></i> Tus Recordatorios</h2>
                <button id="new-reminder-btn" class="btn btn-primary">
                  <i class="fas fa-plus-circle"></i> Nuevo Recordatorio
                </button>
              </div>
              
              <!-- Formulario de creación (oculto por defecto) -->
              <div id="reminder-form-container" class="reminder-form-card" style="display:none;">
                <div class="form-header">
                  <h3><i class="fas fa-plus-circle"></i> Crear Recordatorio</h3>
                  <button id="close-reminder-form" class="btn btn-secondary btn-sm">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <form id="reminder-form">
                  <div class="form-group">
                    <label for="reminder-habit"><i class="fas fa-tasks"></i> Hábito</label>
                    <select id="reminder-habit" required>
                      <option value="">Selecciona un hábito...</option>
                      ${this.habits.map(habit => `
                        <option value="${habit.id}">
                          ${habit.icon || '✅'} ${habit.name}
                        </option>
                      `).join('')}
                    </select>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="reminder-time"><i class="fas fa-clock"></i> Hora</label>
                      <input type="time" id="reminder-time" value="09:00" required />
                    </div>
                    <div class="form-group">
                      <label for="reminder-type"><i class="fas fa-envelope"></i> Tipo</label>
                      <select id="reminder-type">
                        <option value="EMAIL">📧 Email</option>
                        <option value="PUSH">🔔 Push</option>
                        <option value="BOTH">📧🔔 Ambos</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label><i class="fas fa-calendar-week"></i> Días de la semana</label>
                    <div class="days-selector">
                      ${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => `
                        <label class="day-checkbox">
                          <input type="checkbox" name="days" value="${index + 1}" checked />
                          <span>${day}</span>
                        </label>
                      `).join('')}
                    </div>
                    <small><i class="fas fa-info-circle"></i> Selecciona los días en que quieres recibir el recordatorio</small>
                  </div>

                  <div id="reminder-error" class="error-message" style="display:none;"></div>
                  <button type="submit" class="btn btn-primary btn-full">
                    <i class="fas fa-bell"></i> Crear Recordatorio
                  </button>
                </form>
              </div>

              <!-- Lista de recordatorios -->
              <div id="reminders-list" class="reminders-list">
                ${this.renderReminderList()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // ✅ Inicializar gráficos (después de renderizar)
    setTimeout(() => {
      // Solo inicializar si la pestaña de gráficos está visible
      const chartsTab = document.getElementById('tab-charts');
      if (chartsTab && chartsTab.classList.contains('active')) {
        this.initCharts(weeklyData, statusDistribution, streakData, monthlyTrend);
      }
    }, 100);

    // ✅ Inicializar reloj dinámico (sincronizado con backend)
    clock.init();

    // ✅ Agregar event listeners
    document.getElementById('logout-btn').addEventListener('click', () => {
      auth.logout();
    });

    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.refresh();
    });

    // Eventos de pestañas
    this.bindTabEvents();

    // Eventos de hábitos
    document.getElementById('new-habit-btn').addEventListener('click', () => {
      habits.showCreateModal();
    });

    // Eventos de recordatorios
    document.getElementById('new-reminder-btn').addEventListener('click', () => {
      this.toggleReminderForm(true);
    });

    document.getElementById('close-reminder-form').addEventListener('click', () => {
      this.toggleReminderForm(false);
    });

    document.getElementById('reminder-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateReminder();
    });

    // Renderizar hábitos
    this.renderHabits();

    // Bindear eventos de recordatorios
    this.bindReminderEvents();

  } catch (error) {
    console.error('Error cargando dashboard:', error);
    this.showError('Error al cargar el dashboard');
  }
}

/**
 * Bindear eventos de pestañas
 */
bindTabEvents() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = {
    habits: document.getElementById('tab-habits'),
    charts: document.getElementById('tab-charts'),
    reminders: document.getElementById('tab-reminders')
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remover active de todas las pestañas
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Ocultar todos los contenidos
      Object.values(contents).forEach(content => {
        if (content) content.classList.remove('active');
      });

      // Mostrar el contenido seleccionado
      const tabName = tab.dataset.tab;
      if (contents[tabName]) {
        contents[tabName].classList.add('active');

        // Si es la pestaña de gráficos, inicializar gráficos
        if (tabName === 'charts') {
          this.initChartsOnDemand();
        }
      }
    });
  });
}

/**
 * Inicializar gráficos bajo demanda
 */
initChartsOnDemand() {
  // Verificar si los gráficos ya están inicializados
  if (this.chartsInitialized) return;

  // Obtener datos
  Promise.all([
    api.getWeeklySummary(),
    this.getStatusDistribution(),
    this.getStreakData(),
    this.getMonthlyTrend()
  ]).then(([weeklyData, statusData, streakData, monthlyData]) => {
    this.initCharts(weeklyData, statusData, streakData, monthlyData);
    this.chartsInitialized = true;
  }).catch(error => {
    console.error('Error inicializando gráficos:', error);
  });
}

/**
 * Renderizar lista de recordatorios
 */
renderReminderList() {
  if (!this.reminders || this.reminders.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <p>No tienes recordatorios configurados</p>
        <p class="empty-subtitle">Crea un recordatorio para no olvidar tus hábitos</p>
      </div>
    `;
  }

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  return this.reminders.map(reminder => {
    const days = reminder.days 
      ? reminder.days.split(',').map(d => dayNames[parseInt(d) - 1]).join(', ')
      : 'Todos los días';
    
    const habit = this.habits.find(h => h.id === reminder.habitId);
    const habitIcon = habit?.icon || 'fas fa-check';
    const habitName = habit?.name || 'Hábito eliminado';
    const color = habit?.color || '#6366f1';

    return `
      <div class="reminder-item" data-id="${reminder.id}">
        <div class="reminder-info">
          <div class="reminder-icon" style="background: ${color}20; color: ${color};">
            <i class="${habitIcon}"></i>
          </div>
          <div class="reminder-details">
            <h4>${habitName}</h4>
            <div class="reminder-meta">
              <span><i class="fas fa-clock"></i> ${reminder.time}</span>
              <span><i class="fas fa-calendar-alt"></i> ${days}</span>
              <span><i class="fas fa-${reminder.type === 'EMAIL' ? 'envelope' : reminder.type === 'PUSH' ? 'bell' : 'envelope'}"></i> ${reminder.type}</span>
            </div>
          </div>
        </div>
        <div class="reminder-actions">
          <label class="toggle-switch">
            <input type="checkbox" class="toggle-reminder" ${reminder.active ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
          <button class="btn btn-danger btn-sm delete-reminder" data-id="${reminder.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Bindear eventos de recordatorios
 */
bindReminderEvents() {
  // Toggles de recordatorios
  document.querySelectorAll('.toggle-reminder').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const item = e.target.closest('.reminder-item');
      const id = parseInt(item.dataset.id);
      this.toggleReminder(id, e.target.checked);
    });
  });

  // Botones de eliminar
  document.querySelectorAll('.delete-reminder').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.closest('.delete-reminder').dataset.id);
      this.deleteReminder(id);
    });
  });
}

/**
 * Toggle del formulario de recordatorios
 */
toggleReminderForm(show) {
  const container = document.getElementById('reminder-form-container');
  if (show) {
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    container.style.display = 'none';
    // Resetear formulario
    document.getElementById('reminder-form').reset();
    document.getElementById('reminder-error').style.display = 'none';
  }
}

/**
 * Manejar creación de recordatorio
 */
async handleCreateReminder() {
  const habitId = document.getElementById('reminder-habit').value;
  const time = document.getElementById('reminder-time').value;
  const type = document.getElementById('reminder-type').value;
  const daysCheckboxes = document.querySelectorAll('#reminder-form input[name="days"]:checked');
  const days = Array.from(daysCheckboxes).map(cb => cb.value).join(',');
  const errorEl = document.getElementById('reminder-error');

  try {
    errorEl.style.display = 'none';

    if (!habitId) {
      throw new Error('Por favor selecciona un hábito');
    }

    const response = await api.post('/api/reminders', {
      habitId: parseInt(habitId),
      time,
      days: days || null,
      type
    });

    if (response.success) {
      this.showNotification('✅ Recordatorio creado exitosamente', 'success');
      this.toggleReminderForm(false);
      await this.refresh();
    }
  } catch (error) {
    errorEl.textContent = error.message || 'Error al crear recordatorio';
    errorEl.style.display = 'block';
  }
}

/**
 * Activar/desactivar recordatorio
 */
async toggleReminder(id, active) {
  try {
    const response = await api.put(`/api/reminders/${id}`, { active });
    
    if (response.success) {
      const message = active ? 'activado' : 'desactivado';
      this.showNotification(`✅ Recordatorio ${message}`, 'info');
      await this.refresh();
    }
  } catch (error) {
    console.error('Error toggling reminder:', error);
    this.showNotification('❌ Error al actualizar recordatorio', 'error');
  }
}

/**
 * Eliminar recordatorio
 */
async deleteReminder(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este recordatorio?')) return;

  try {
    const response = await api.delete(`/api/reminders/${id}`);
    
    if (response.success) {
      this.showNotification('🗑️ Recordatorio eliminado', 'success');
      await this.refresh();
    }
  } catch (error) {
    console.error('Error deleting reminder:', error);
    this.showNotification('❌ Error al eliminar recordatorio', 'error');
  }
}

/**
 * Mostrar notificación (toast)
 */
showNotification(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `toast-notification toast-${type}`;
  notification.innerHTML = `
    <div class="toast-content">
      <span>${message}</span>
      <button class="toast-close"><i class="fas fa-times"></i></button>
    </div>
  `;

  // Agregar al DOM
  document.body.appendChild(notification);

  // Animación de entrada
  setTimeout(() => notification.classList.add('show'), 10);

  // Configurar cierre
  notification.querySelector('.toast-close').addEventListener('click', () => {
    this.closeNotification(notification);
  });

  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    this.closeNotification(notification);
  }, 5000);
}

/**
 * Cerrar notificación
 */
closeNotification(notification) {
  notification.classList.remove('show');
  setTimeout(() => {
    notification.remove();
  }, 300);
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