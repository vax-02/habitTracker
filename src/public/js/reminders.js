/**
 * Módulo de gestión de recordatorios
 */
class RemindersModule {
  constructor() {
    this.reminders = [];
    this.habits = [];
  }

  /**
   * Renderizar página de recordatorios
   */
  async render() {
    try {
      // Obtener datos
      const remindersData = await api.get('/api/reminders');
      this.reminders = remindersData.data || [];
      
      const habitsData = await api.get('/api/habits');
      this.habits = habitsData.data || [];

      const content = document.getElementById('app-content');
      content.innerHTML = `
        <div class="reminders-container">
          <div class="reminders-header">
            <h1><i class="fas fa-bell" style="color: var(--primary);"></i> Recordatorios</h1>
            <p class="subtitle">
              <i class="fas fa-clock"></i> Configura recordatorios para tus hábitos
            </p>
          </div>

          <!-- Formulario de creación -->
          <div class="reminder-form-card">
            <h3><i class="fas fa-plus-circle"></i> Nuevo Recordatorio</h3>
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
          <div class="reminders-list-section">
            <div class="section-header">
              <h3><i class="fas fa-list"></i> Tus Recordatorios</h3>
              <span class="badge">${this.reminders.length}</span>
            </div>
            <div id="reminders-list" class="reminders-list">
              ${this.renderReminderList()}
            </div>
          </div>
        </div>
      `;

      // ✅ Agregar event listeners
      this.bindEvents();
    } catch (error) {
      console.error('Error renderizando recordatorios:', error);
      this.showError('Error al cargar recordatorios');
    }
  }

  /**
   * Renderizar lista de recordatorios
   */
  renderReminderList() {
    if (this.reminders.length === 0) {
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
      const habitIcon = habit?.icon || '✅';
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
   * Bindear eventos
   */
  bindEvents() {
    // Formulario de creación
    document.getElementById('reminder-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateReminder();
    });

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
   * Manejar creación de recordatorio
   */
  async handleCreateReminder() {
    const habitId = document.getElementById('reminder-habit').value;
    const time = document.getElementById('reminder-time').value;
    const type = document.getElementById('reminder-type').value;
    const daysCheckboxes = document.querySelectorAll('input[name="days"]:checked');
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
        // Mostrar notificación de éxito
        this.showNotification('✅ Recordatorio creado exitosamente', 'success');
        
        // Recargar lista
        await this.render();
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
        await this.render();
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
        await this.render();
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
   * Mostrar error
   */
  showError(message) {
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="error-page">
        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--danger);"></i>
        <h2>Error</h2>
        <p>${message}</p>
        <button onclick="renderApp()" class="btn btn-primary">
          <i class="fas fa-redo"></i> Intentar de nuevo
        </button>
      </div>
    `;
  }
}

// Instancia global
const reminders = new RemindersModule();