/**
 * Módulo de Reloj Dinámico
 * Sincroniza la hora con el backend una sola vez y luego corre en el frontend
 */
class ClockModule {
  constructor() {
    this.offset = 0; // Diferencia entre hora del servidor y del cliente
    this.timer = null;
    this.initialized = false;
  }

  /**
   * Inicializar reloj: obtener hora del servidor y arrancar contador
   */
  async init() {
    if (this.initialized) return;

    try {
      // 1. Obtener hora del servidor (una sola vez)
      const response = await api.get('/api/time');
      const serverTime = new Date(response.data.serverTime).getTime();

      // 2. Calcular offset (compensa latencia de red)
      this.offset = serverTime - Date.now();

      // 3. Arrancar contador en frontend
      this.initialized = true;
      this.start();
    } catch (error) {
      console.error('❌ Error inicializando reloj:', error);
      // Fallback: usar hora local si el backend no responde
      this.offset = 0;
      this.initialized = true;
      this.start();
    }
  }

  /**
   * Arrancar el contador
   */
  start() {
    this.update(); // Actualizar inmediatamente
    this.timer = setInterval(() => this.update(), 1000);
  }

  /**
   * Actualizar el reloj en el DOM
   */
  update() {
    const now = new Date(Date.now() + this.offset);
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');

    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString('es-ES', { hour12: false });
    }

    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  /**
   * Detener el reloj (cleanup al navegar)
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.initialized = false;
  }
}

// Instancia global
const clock = new ClockModule();