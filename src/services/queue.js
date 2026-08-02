const Bull = require('bull');
const { sendReminderEmail } = require('../config/email');

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
    const { userId, habitId, habitName, userEmail, userName, reminderId } = job.data;
    
    console.log(`📧 Enviando recordatorio a ${userEmail} para ${habitName}`);
    
    // Enviar email
    await sendReminderEmail(userEmail, habitName, userName);
    
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