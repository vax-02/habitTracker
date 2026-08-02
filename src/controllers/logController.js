const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

/**
 * Registrar progreso de un hábito para hoy
 * POST /api/habits/:id/log
 */

const logHabitToday = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { status, notes } = req.body;

    // Verificar que el hábito existe y pertenece al usuario
    const habit = await prisma.habit.findFirst({
      where: {
        id: parseInt(id),
        userId
      }
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado',
        code: 'HABIT_NOT_FOUND'
      });
    }

    // Obtener fecha actual (sin hora)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar si ya existe un log para hoy
    let existingLog = await prisma.habitLog.findFirst({
      where: {
        habitId: parseInt(id),
        userId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    let log;
    let isNew = false;

    if (existingLog) {
      // Actualizar log existente
      log = await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: {
          status,
          ...(notes !== undefined && { notes: notes || null })
        }
      });
    } else {
      // ✅ Crear nuevo log con manejo de error de unique constraint
      try {
        log = await prisma.habitLog.create({
          data: {
            habitId: parseInt(id),
            userId,
            date: today,
            status,
            notes: notes || null
          }
        });
        isNew = true;
      } catch (createError) {
        // Si hay error de unique constraint, intentar actualizar
        if (createError.code === 'P2002') {
          const retryLog = await prisma.habitLog.findFirst({
            where: {
              habitId: parseInt(id),
              userId,
              date: {
                gte: today,
                lt: tomorrow
              }
            }
          });
          
          if (retryLog) {
            log = await prisma.habitLog.update({
              where: { id: retryLog.id },
              data: {
                status,
                ...(notes !== undefined && { notes: notes || null })
              }
            });
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      }
    }

    // ✅ Devolver 201 si es nuevo, 200 si es actualización
    const statusCode = isNew ? 201 : 200;
    const message = isNew ? 'Progreso registrado' : 'Progreso actualizado';

    res.status(statusCode).json({
      success: true,
      message,
      data: log
    });
  } catch (error) {
    console.error('Log habit today error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar progreso',
      code: 'LOG_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



/**
 * Obtener logs de un hábito específico
 * GET /api/habits/:id/logs
 */
const getHabitLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;

    // Verificar que el hábito existe
    const habit = await prisma.habit.findFirst({
      where: {
        id: parseInt(id),
        userId
      }
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado',
        code: 'HABIT_NOT_FOUND'
      });
    }

    // Construir filtros de fecha
    const where = {
      habitId: parseInt(id),
      userId
    };

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.date = { ...where.date, gte: start };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = { ...where.date, lte: end };
    }

    // Obtener logs
    const logs = await prisma.habitLog.findMany({
      where,
      orderBy: { date: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Get habit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs',
      code: 'GET_LOGS_ERROR'
    });
  }
};

/**
 * Obtener dashboard del usuario con resumen de hoy
 * GET /api/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // ✅ Obtener fecha actual en UTC
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    // ✅ También obtener la fecha en formato local para comparación
    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);

    // Obtener todos los hábitos del usuario
    const habits = await prisma.habit.findMany({
      where: { userId }
    });

    // ✅ Obtener logs de hoy usando ambas estrategias
    const todayLogs = await prisma.habitLog.findMany({
      where: {
        userId,
        OR: [
          {
            date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          },
          {
            date: {
              gte: todayLocal,
              lt: new Date(todayLocal.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        ]
      }
    });

    // ✅ Si no hay logs con las fechas exactas, intentar con el día actual sin hora
    if (todayLogs.length === 0) {
      const todayStr = todayLocal.toISOString().split('T')[0];
      const additionalLogs = await prisma.habitLog.findMany({
        where: {
          userId,
          date: {
            gte: new Date(todayStr),
            lt: new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });
      todayLogs.push(...additionalLogs);
    }

    // Calcular estadísticas del día
    const totalHabits = habits.length;
    const completedToday = todayLogs.filter(log => log.status === 'COMPLETED').length;
    const skippedToday = todayLogs.filter(log => log.status === 'SKIPPED').length;
    const failedToday = todayLogs.filter(log => log.status === 'FAILED').length;
    const pendingToday = totalHabits - todayLogs.length;

    // Calcular tasa de completado del día
    const completionRate = totalHabits > 0 
      ? Math.round((completedToday / totalHabits) * 100) 
      : 0;

    // Calcular racha global
    const globalStreak = await calculateGlobalStreak(userId);

    // Obtener hábitos con su estado de hoy
    const habitsWithStatus = habits.map(habit => {
      const todayLog = todayLogs.find(log => log.habitId === habit.id);
      
      return {
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        frequency: habit.frequency,
        todayStatus: todayLog ? todayLog.status : 'PENDING'
      };
    });

    res.json({
      success: true,
      data: {
        date: todayLocal.toISOString().split('T')[0],
        summary: {
          totalHabits,
          completedToday,
          skippedToday,
          failedToday,
          pendingToday,
          completionRate,
          globalStreak
        },
        habits: habitsWithStatus
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard',
      code: 'DASHBOARD_ERROR'
    });
  }
};
/**
 * Obtener resumen semanal del usuario
 * GET /api/dashboard/weekly
 */
const getWeeklySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular inicio de la semana (lunes)
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Obtener todos los hábitos del usuario
    const habits = await prisma.habit.findMany({
      where: { userId }
    });

    // Obtener logs de la semana
    const logs = await prisma.habitLog.findMany({
      where: {
        userId,
        date: {
          gte: startOfWeek,
          lte: today
        }
      },
      orderBy: { date: 'asc' }
    });

    // Generar días de la semana
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      weekDays.push({
        date,
        dayName: dayNames[i]
      });
    }

    // Calcular estadísticas por día
    const dailyStats = weekDays.map(day => {
      const dateStr = day.date.toISOString().split('T')[0];
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === day.date.getTime();
      });

      const completed = dayLogs.filter(log => log.status === 'COMPLETED').length;
      const total = habits.length;

      return {
        date: dateStr,
        dayName: day.dayName,
        completed,
        total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        logs: dayLogs.map(log => ({
          habitId: log.habitId,
          status: log.status
        }))
      };
    });

    // Calcular estadísticas generales de la semana
    const totalCompleted = dailyStats.reduce((sum, day) => sum + day.completed, 0);
    const totalHabits = habits.length;
    const possibleCompletions = totalHabits * 7;
    const overallRate = possibleCompletions > 0 
      ? Math.round((totalCompleted / possibleCompletions) * 100) 
      : 0;

    // ✅ Agregar la propiedad 'weekly' para compatibilidad con tests
    res.json({
      success: true,
      data: {
        week: {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        },
        weekly: { // ✅ Agregado para compatibilidad
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        },
        summary: {
          totalHabits,
          totalCompleted,
          possibleCompletions,
          overallCompletionRate: overallRate
        },
        dailyStats
      }
    });
  } catch (error) {
    console.error('Get weekly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen semanal',
      code: 'WEEKLY_ERROR'
    });
  }
};


/**
 * Obtener racha actual del usuario
 * GET /api/dashboard/streak
 */
const getStreak = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentStreak = await calculateGlobalStreak(userId);

    res.json({
      success: true,
      data: {
        currentStreak,
        message: currentStreak === 0 
          ? 'No tienes racha actual' 
          : `Llevas ${currentStreak} ${currentStreak === 1 ? 'día' : 'días'} de racha! 🎉`
      }
    });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener racha',
      code: 'STREAK_ERROR'
    });
  }
};

/**
 * Función auxiliar para calcular la racha global del usuario
 */
const calculateGlobalStreak = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener todos los hábitos del usuario
    const habits = await prisma.habit.findMany({
      where: { userId },
      select: { id: true }
    });

    if (habits.length === 0) return 0;

    const habitIds = habits.map(h => h.id);

    // Obtener logs de los últimos 90 días
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 90);

    const logs = await prisma.habitLog.findMany({
      where: {
        userId,
        habitId: { in: habitIds },
        date: {
          gte: startDate
        }
      },
      orderBy: { date: 'desc' }
    });

    // Agrupar logs por día
    const logsByDate = {};
    logs.forEach(log => {
      const dateStr = log.date.toISOString().split('T')[0];
      if (!logsByDate[dateStr]) {
        logsByDate[dateStr] = [];
      }
      logsByDate[dateStr].push(log);
    });

    // Verificar si hoy tiene logs
    const todayStr = today.toISOString().split('T')[0];
    const hasTodayLogs = logsByDate[todayStr] !== undefined;

    // Si no hay logs hoy, verificar ayer
    if (!hasTodayLogs) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (!logsByDate[yesterdayStr]) {
        return 0;
      }
    }

    // Calcular racha desde el día actual hacia atrás
    let streak = 0;
    let currentDate = hasTodayLogs ? today : new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const totalHabits = habits.length;
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayLogs = logsByDate[dateStr] || [];
      
      // Verificar si todos los hábitos están completados en este día
      const allCompleted = dayLogs.every(log => log.status === 'COMPLETED');
      const hasAllHabits = dayLogs.length === totalHabits;
      
      if (allCompleted && hasAllHabits) {
        streak++;
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Calculate streak error:', error);
    return 0;
  }
};

module.exports = {
  logHabitToday,
  getHabitLogs,
  getDashboard,
  getWeeklySummary,
  getStreak,
  calculateGlobalStreak
};

