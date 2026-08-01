const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

/**
 * Obtener todos los hábitos del usuario autenticado
 * GET /api/habits
 */
const getHabits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, search } = req.query;

    // Construir filtros
    const where = { userId };
    
    if (status) {
      // Si se pide por estado, filtrar (implementar después con logs)
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Calcular offset para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Obtener hábitos con paginación
    const [habits, total] = await Promise.all([
      prisma.habit.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              logs: true
            }
          },
          logs: {
            take: 7, // Últimos 7 días
            orderBy: { date: 'desc' },
            select: {
              date: true,
              status: true
            }
          }
        }
      }),
      prisma.habit.count({ where })
    ]);

    // Calcular métricas para cada hábito
    const habitsWithMetrics = habits.map(habit => {
      const totalLogs = habit._count.logs;
      const completedLogs = habit.logs.filter(log => log.status === 'COMPLETED').length;
      const completionRate = totalLogs > 0 ? (completedLogs / totalLogs) * 100 : 0;
      
      // Calcular racha actual
      let currentStreak = 0;
      const sortedLogs = habit.logs.sort((a, b) => b.date - a.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const log of sortedLogs) {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        
        // Verificar si es hoy o días consecutivos
        const diffDays = Math.floor((today - logDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === currentStreak && log.status === 'COMPLETED') {
          currentStreak++;
        } else if (log.status !== 'COMPLETED' && diffDays > 0) {
          break;
        }
      }

      return {
        ...habit,
        metrics: {
          totalLogs,
          completedLogs,
          completionRate: Math.round(completionRate),
          currentStreak
        }
      };
    });

    res.json({
      success: true,
      data: habitsWithMetrics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener hábitos',
      code: 'GET_HABITS_ERROR'
    });
  }
};

/**
 * Obtener un hábito específico con sus logs
 * GET /api/habits/:id
 */
const getHabitById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const habit = await prisma.habit.findFirst({
      where: {
        id: parseInt(id),
        userId
      },
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 30 // Últimos 30 días
        },
        reminders: {
          where: { active: true }
        }
      }
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado',
        code: 'HABIT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: habit
    });
  } catch (error) {
    console.error('Get habit by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el hábito',
      code: 'GET_HABIT_ERROR'
    });
  }
};

/**
 * Crear un nuevo hábito
 * POST /api/habits
 */
const createHabit = async (req, res) => {
  try {
    // Validar errores
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

    const userId = req.user.id;
    const { name, description, frequency, targetDays, color, icon } = req.body;

    // Verificar que el usuario no tenga un hábito con el mismo nombre
    const existingHabit = await prisma.habit.findFirst({
      where: {
        userId,
        name: name.trim()
      }
    });

    if (existingHabit) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes un hábito con este nombre',
        code: 'DUPLICATE_HABIT'
      });
    }

    // Crear el hábito
    const habit = await prisma.habit.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        frequency,
        targetDays: targetDays || null,
        color: color || '#4CAF50',
        icon: icon || '✅'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Hábito creado exitosamente',
      data: habit
    });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el hábito',
      code: 'CREATE_HABIT_ERROR'
    });
  }
};

/**
 * Actualizar un hábito existente
 * PUT /api/habits/:id
 */
const updateHabit = async (req, res) => {
  try {
    // Validar errores
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
    const { name, description, frequency, targetDays, color, icon } = req.body;

    // Verificar que el hábito existe y pertenece al usuario
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: parseInt(id),
        userId
      }
    });

    if (!existingHabit) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado',
        code: 'HABIT_NOT_FOUND'
      });
    }

    // Verificar nombre duplicado (si se está cambiando)
    if (name && name !== existingHabit.name) {
      const duplicate = await prisma.habit.findFirst({
        where: {
          userId,
          name: name.trim(),
          NOT: { id: parseInt(id) }
        }
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Ya tienes un hábito con este nombre',
          code: 'DUPLICATE_HABIT'
        });
      }
    }

    // Actualizar el hábito
    const updatedHabit = await prisma.habit.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(frequency && { frequency }),
        ...(targetDays !== undefined && { targetDays }),
        ...(color && { color }),
        ...(icon && { icon })
      }
    });

    res.json({
      success: true,
      message: 'Hábito actualizado exitosamente',
      data: updatedHabit
    });
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el hábito',
      code: 'UPDATE_HABIT_ERROR'
    });
  }
};

/**
 * Eliminar un hábito (soft delete opcional)
 * DELETE /api/habits/:id
 */
const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

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

    // Eliminar el hábito (cascade eliminará logs y reminders)
    await prisma.habit.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Hábito eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el hábito',
      code: 'DELETE_HABIT_ERROR'
    });
  }
};

/**
 * Obtener estadísticas de un hábito
 * GET /api/habits/:id/stats
 */
const getHabitStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { days = 30 } = req.query;

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

    // Obtener logs de los últimos N días
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: parseInt(id),
        date: {
          gte: startDate
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calcular estadísticas
    const totalDays = parseInt(days);
    const completedDays = logs.filter(log => log.status === 'COMPLETED').length;
    const skippedDays = logs.filter(log => log.status === 'SKIPPED').length;
    const failedDays = logs.filter(log => log.status === 'FAILED').length;
    
    // Calcular racha actual
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    const sortedLogs = logs.sort((a, b) => b.date - a.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const log of sortedLogs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today - logDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= parseInt(days)) {
        if (log.status === 'COMPLETED') {
          tempStreak++;
          if (diffDays === 0) {
            currentStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
          if (diffDays === 0) {
            currentStreak = 0;
          }
        }
        bestStreak = Math.max(bestStreak, tempStreak);
      }
    }

    // Datos para gráficos (por día)
    const dailyData = [];
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const log = logs.find(l => {
        const logDate = new Date(l.date);
        return logDate.toISOString().split('T')[0] === dateStr;
      });
      
      dailyData.push({
        date: dateStr,
        status: log ? log.status : 'PENDING'
      });
    }

    res.json({
      success: true,
      data: {
        habit: {
          id: habit.id,
          name: habit.name,
          frequency: habit.frequency,
          targetDays: habit.targetDays
        },
        stats: {
          totalDays,
          completedDays,
          skippedDays,
          failedDays,
          pendingDays: totalDays - completedDays - skippedDays - failedDays,
          completionRate: Math.round((completedDays / totalDays) * 100),
          currentStreak,
          bestStreak
        },
        dailyData
      }
    });
  } catch (error) {
    console.error('Get habit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      code: 'GET_STATS_ERROR'
    });
  }
};

module.exports = {
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  getHabitStats
};