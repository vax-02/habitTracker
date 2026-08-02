const Bull = require('bull');
const { sendReminderEmail } = require('../config/email');
const { sendPushNotification } = require('../config/push');

// Crear cola de recordatorios
const reminderQueue = new Bull('reminders', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true
  }
});

// Procesar trabajos de recordatorios
reminderQueue.process(async (job) => {
  try {
    const {
      userId,
      habitId,
      habitName,
      habitIcon,
      userEmail,
      userName,
      reminderId,
      type,
      pushSubscriptions = []
    } = job.data;

    console.log(`📨 Procesando recordatorio "${habitName}" tipo: ${type}`);

    // Enviar email si aplica
    if (type === 'EMAIL' || type === 'BOTH') {
      console.log(`📧 Enviando email a ${userEmail} para ${habitName}`);
      await sendReminderEmail(userEmail, habitName, userName);
    }

    // Enviar push si aplica
    if (type === 'PUSH' || type === 'BOTH') {
      const payload = {
        title: '⏰ Recordatorio',
        body: `¡No olvides completar tu hábito: ${habitName}!`,
        icon: habitIcon || '✅',
        url: process.env.APP_URL || 'http://localhost:3000'
      };

      for (const subscription of pushSubscriptions) {
        console.log(`📲 Enviando push a suscripción de ${userName}`);
        const result = await sendPushNotification(subscription, payload);
        if (result && result.expired) {
          // Suscripción expirada - eliminar de BD
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: subscription.endpoint }
          });
          await prisma.$disconnect();
        }
      }
    }

    // Actualizar last_sent en la base de datos
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.reminder.update({
      where: { id: reminderId },
      data: { lastSent: new Date() }
    });

    await prisma.$disconnect();

    console.log(`✅ Recordatorio enviado para ${habitName}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error en queue de recordatorios:', error);
    throw error;
  }
});

// Eventos de la cola
reminderQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completado`);
});

reminderQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} falló:`, err);
});

reminderQueue.on('stalled', (job) => {
  console.warn(`⚠️ Job ${job.id} stalled`);
});

module.exports = { reminderQueue };