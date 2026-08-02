const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { reminderQueue } = require('./queue');

const prisma = new PrismaClient();

/**
 * Programar envío de recordatorios
 */
function scheduleReminders() {
  console.log('⏰ Iniciando scheduler de recordatorios...');
  
  // Ejecutar cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('🔄 Verificando recordatorios pendientes...');
      
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                         now.getMinutes().toString().padStart(2, '0');
      
      // Obtener día de la semana (1-7, lunes=1)
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      
      console.log(`⏰ Hora actual: ${currentTime}, Día: ${dayOfWeek}`);
      
      // Buscar recordatorios activos programados para esta hora
      const reminders = await prisma.reminder.findMany({
        where: {
          active: true,
          time: currentTime,
          OR: [
            { days: null }, // Diario
            { days: { contains: dayOfWeek.toString() } } // Días específicos
          ],
          lastSent: {
            lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // No enviado en las últimas 24h
          }
        },
        include: {
          user: true,
          habit: true
        }
      });
      
      if (reminders.length === 0) {
        console.log('ℹ️ No hay recordatorios pendientes');
        return;
      }
      
      console.log(`📨 Se encontraron ${reminders.length} recordatorios para enviar`);
      
      // Agregar trabajos a la cola
      for (const reminder of reminders) {
        await reminderQueue.add('send-reminder', {
          userId: reminder.userId,
          habitId: reminder.habitId,
          habitName: reminder.habit.name,
          userEmail: reminder.user.email,
          userName: reminder.user.name,
          reminderId: reminder.id
        });
        
        console.log(`📌 Recordatorio añadido a la cola: ${reminder.habit.name}`);
      }
      
    } catch (error) {
      console.error('❌ Error en scheduler:', error);
    }
  });
  
  console.log('✅ Scheduler de recordatorios iniciado');
}

module.exports = { scheduleReminders };