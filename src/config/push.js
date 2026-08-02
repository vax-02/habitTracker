const webpush = require('web-push');

// Configurar VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@habittracker.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('✅ Web Push configurado con VAPID keys');
} else {
  console.warn('⚠️ VAPID keys no configuradas. Las notificaciones push no estarán disponibles.');
}

/**
 * Enviar notificación push a una suscripción
 */
async function sendPushNotification(subscription, payload) {
  try {
    const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('📲 Push enviado:', result.statusCode);
    return result;
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Suscripción expirada o inválida
      console.warn('⚠️ Suscripción push expirada o inválida:', error.statusCode);
      return { expired: true };
    }
    console.error('❌ Error enviando push:', error);
    throw error;
  }
}

module.exports = { webpush, sendPushNotification, vapidPublicKey };