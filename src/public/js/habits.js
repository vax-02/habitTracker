/**
 * Módulo de gestión de hábitos
 */
class HabitsModule {
  constructor() {
    this.editingId = null;
  }

  /**
   * Mostrar modal para crear hábito
   */
  showCreateModal() {
    this.editingId = null;
    this.showModal({
      title: 'Crear Nuevo Hábito',
      submitText: 'Crear Hábito',
      data: {
        name: '',
        description: '',
        frequency: 'DAILY',
        targetDays: 7,
        color: '#4CAF50',
        icon: ''
      }
    });
  }

  /**
   * Mostrar modal para editar hábito
   */
  showEditModal(id) {
    const habit = dashboard.habits.find(h => h.id === id);
    if (!habit) return;

    this.editingId = id;
    this.showModal({
      title: 'Editar Hábito',
      submitText: 'Actualizar Hábito',
      data: {
        name: habit.name,
        description: habit.description || '',
        frequency: habit.frequency,
        targetDays: habit.targetDays || 7,
        color: habit.color || '#4CAF50',
        icon: habit.icon || '✅'
      }
    });
  }

  /**
   * Mostrar modal
   */
  showModal({ title, submitText, data }) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal" id="modal-content">
          <div class="modal-header">
            <h2>${title}</h2>
            <button id="modal-close-btn" class="modal-close">✕</button>
          </div>
          <form id="habit-form">
            <div class="form-group">
              <label for="habit-name">Nombre *</label>
              <input type="text" id="habit-name" value="${data.name}" placeholder="Ej: Leer 30 minutos" required />
            </div>
            <div class="form-group">
              <label for="habit-description">Descripción</label>
              <textarea id="habit-description" placeholder="Descripción del hábito">${data.description}</textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="habit-frequency">Frecuencia</label>
                <select id="habit-frequency">
                  <option value="DAILY" ${data.frequency === 'DAILY' ? 'selected' : ''}>Diario</option>
                  <option value="WEEKLY" ${data.frequency === 'WEEKLY' ? 'selected' : ''}>Semanal</option>
                  <option value="MONTHLY" ${data.frequency === 'MONTHLY' ? 'selected' : ''}>Mensual</option>
                </select>
              </div>
              <div class="form-group">
                <label for="habit-target">Días objetivo</label>
                <input type="number" id="habit-target" value="${data.targetDays}" min="1" max="7" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="habit-color">Color</label>
                <input type="color" id="habit-color" value="${data.color}" />
              </div>
              <div class="form-group">
                <label for="habit-icon">Icono</label>
                <input type="text" id="habit-icon" value="${data.icon}" placeholder="✅" maxlength="10" />
              </div>
            </div>
            <div id="habit-error" class="error-message" style="display:none;"></div>
            <button type="submit" class="btn btn-primary btn-full">${submitText}</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('modal-overlay').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('modal-content').addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.getElementById('modal-close-btn').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('habit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  /**
   * Manejar envío del formulario
   */
  async handleSubmit() {
    const name = document.getElementById('habit-name').value;
    const description = document.getElementById('habit-description').value;
    const frequency = document.getElementById('habit-frequency').value;
    const targetDays = parseInt(document.getElementById('habit-target').value);
    const color = document.getElementById('habit-color').value;
    const icon = document.getElementById('habit-icon').value || '✅';
    const errorEl = document.getElementById('habit-error');

    try {
      errorEl.style.display = 'none';
      
      const data = { name, description, frequency, targetDays, color, icon };
      
      if (this.editingId) {
        await api.updateHabit(this.editingId, data);
      } else {
        await api.createHabit(data);
      }

      this.closeModal();
      await dashboard.refresh();
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.style.display = 'block';
    }
  }

  /**
   * Registrar progreso de un hábito hoy
   */
  async logToday(habitId) {
    try {
      // Verificar estado actual
      const habit = dashboard.habits.find(h => h.id === habitId);
      const currentStatus = habit.todayStatus || 'PENDING';
      
      // Si ya está completado, cambiar a PENDING? O solo permitir completar
      if (currentStatus === 'COMPLETED') {
        if (!confirm('¿Ya completaste este hábito hoy. ¿Quieres marcarlo como pendiente?')) {
          return;
        }
        await api.logHabit(habitId, { status: 'PENDING' });
      } else {
        await api.logHabit(habitId, { status: 'COMPLETED' });
      }

      await dashboard.refresh();
    } catch (error) {
      alert('Error al registrar progreso: ' + error.message);
    }
  }

  /**
   * Eliminar un hábito
   */
  async deleteHabit(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este hábito?')) return;
    
    try {
      await api.deleteHabit(id);
      await dashboard.refresh();
    } catch (error) {
      alert('Error al eliminar hábito: ' + error.message);
    }
  }

  /**
   * Cerrar modal
   */
  closeModal() {
    document.getElementById('modal-container').innerHTML = '';
  }
}

// Instancia global
const habits = new HabitsModule();