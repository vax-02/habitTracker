/**
 * Módulo de notificaciones push
 */
class PushModule {
  constructor() {
    this.swRegistration = null;
    this.vapidPublicKey = null;
  }

  /**
   * Verificar si el navegador soporta push
   */
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Registrar service worker
   */
  async registerServiceWorker() {
    if (!this.isSupported()) {
      console.warn('⚠️ Push notifications no soportadas en este navegador');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado');
      return true;
    } catch (error) {
      console.error('❌ Error registrando service worker:', error);
      return false;
    }
  }

  /**
   * Obtener clave pública VAPID del servidor
   */
  async getVapidKey() {
    try {
      const response = await api.get('/api/push/vapid-key');
      if (response.success) {
        this.vapidPublicKey = response.data.publicKey;
        return this.vapidPublicKey;
      }
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo VAPID key:', error);
      return null;
    }
  }

  /**
   * Convertir clave base64 a Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Suscribirse a notificaciones push
   */
  async subscribe() {
    if (!this.isSupported()) return false;

    try {
      // Registrar service worker si no está registrado
      if (!this.swRegistration) {
        const registered = await this.registerServiceWorker();
        if (!registered) return false;
      }

      // Obtener VAPID key si no la tenemos
      if (!this.vapidPublicKey) {
        await this.getVapidKey();
        if (!this.vapidPublicKey) {
          console.warn('⚠️ No se pudo obtener VAPID key');
          return false;
        }
      }

      // Solicitar permiso
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ Permiso de notificaciones denegado');
        return false;
      }

      // Verificar si ya está suscrito
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('✅ Ya suscrito a push notifications');
        // Enviar suscripción al servidor
        await this.sendSubscriptionToServer(existingSubscription);
        return true;
      }

      // Crear nueva suscripción
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('✅ Suscrito a push notifications');
      await this.sendSubscriptionToServer(subscription);
      return true;
    } catch (error) {
      console.error('❌ Error suscribiéndose a push:', error);
      return false;
    }
  }

  /**
   * Enviar suscripción al servidor
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await api.post('/api/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
        }
      });
      console.log('✅ Suscripción enviada al servidor');
      return response.success;
    } catch (error) {
      console.error('❌ Error enviando suscripción al servidor:', error);
      return false;
    }
  }

  /**
   * Desuscribirse de notificaciones push
   */
  async unsubscribe() {
    if (!this.isSupported() || !this.swRegistration) return false;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        // Eliminar del servidor
        await api.delete('/api/push/subscribe', {
          endpoint: subscription.endpoint
        });

        // Desuscribirse localmente
        await subscription.unsubscribe();
        console.log('✅ Desuscrito de push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error desuscribiéndose:', error);
      return false;
    }
  }

  /**
   * Inicializar push notifications
   */
  async init() {
    if (!this.isSupported()) {
      console.warn('⚠️ Push notifications no soportadas');
      return;
    }

    await this.registerServiceWorker();
    await this.getVapidKey();

    // Solicitar permiso y suscribirse automáticamente
    await this.subscribe();
  }
}

// Instancia global
const pushModule = new PushModule();