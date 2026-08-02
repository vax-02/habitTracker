// Service Worker para notificaciones push
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activado');
  event.waitUntil(clients.claim());
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('📲 Push recibido:', event.data ? event.data.text() : 'sin datos');

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Habit Tracker', body: event.data ? event.data.text() : 'Nueva notificación' };
  }

  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || '/assets/images/icon-192.svg',
    badge: '/assets/images/icon-192.svg',
    data: {
      url: data.url || '/'
    },
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'open',
        title: 'Ver hábitos'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Habit Tracker', options)
  );
});

// Manejar clic en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificación clickeada:', event.notification);

  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Manejar cierre de notificación
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notificación cerrada');
});