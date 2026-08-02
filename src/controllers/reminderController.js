const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

/**
 * Obtener todos los recordatorios del usuario
 * GET /api/reminders
 */
const getReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const reminders = await prisma.reminder.findMany({
      where: { userId },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      },
      orderBy: { time: 'asc' }
    });
    
    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recordatorios'
    });
  }
};

/**
 * Crear un nuevo recordatorio
 * POST /api/reminders
 */
const createReminder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const userId = req.user.id;
    const { habitId, time, days, type = 'EMAIL' } = req.body;
    
    // Verificar que el hábito existe y pertenece al usuario
    const habit = await prisma.habit.findFirst({
      where: {
        id: parseInt(habitId),
        userId
      }
    });
    
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado'
      });
    }
    
    // Verificar que no haya un recordatorio duplicado
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        userId,
        habitId: parseInt(habitId),
        time,
        active: true
      }
    });
    
    if (existingReminder) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un recordatorio activo para este hábito a esta hora'
      });
    }
    
    // Crear recordatorio
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        habitId: parseInt(habitId),
        time,
        days: days || null,
        type
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Recordatorio creado exitosamente',
      data: reminder
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear recordatorio'
    });
  }
};

/**
 * Actualizar un recordatorio
 * PUT /api/reminders/:id
 */
const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { time, days, active, type } = req.body;
    
    // Verificar que el recordatorio existe y pertenece al usuario
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: parseInt(id),
        userId
      }
    });
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Recordatorio no encontrado'
      });
    }
    
    // Actualizar recordatorio
    const updatedReminder = await prisma.reminder.update({
      where: { id: parseInt(id) },
      data: {
        ...(time && { time }),
        ...(days !== undefined && { days: days || null }),
        ...(active !== undefined && { active }),
        ...(type && { type })
      }
    });
    
    res.json({
      success: true,
      message: 'Recordatorio actualizado exitosamente',
      data: updatedReminder
    });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar recordatorio'
    });
  }
};

/**
 * Eliminar un recordatorio
 * DELETE /api/reminders/:id
 */
const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar que el recordatorio existe y pertenece al usuario
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: parseInt(id),
        userId
      }
    });
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Recordatorio no encontrado'
      });
    }
    
    // Eliminar recordatorio
    await prisma.reminder.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({
      success: true,
      message: 'Recordatorio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar recordatorio'
    });
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder
};