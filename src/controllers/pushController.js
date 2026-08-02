const { PrismaClient } = require('@prisma/client');
const { vapidPublicKey } = require('../config/push');

const prisma = new PrismaClient();

/**
 * Obtener la clave pública VAPID
 * GET /api/push/vapid-key
 */
const getVapidPublicKey = async (req, res) => {
  try {
    if (!vapidPublicKey) {
      return res.status(503).json({
        success: false,
        message: 'Push notifications no configuradas'
      });
    }

    res.json({
      success: true,
      data: { publicKey: vapidPublicKey }
    });
  } catch (error) {
    console.error('Get VAPID key error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clave VAPID'
    });
  }
};

/**
 * Guardar suscripción push del usuario
 * POST /api/push/subscribe
 */
const subscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Suscripción inválida'
      });
    }

    // Verificar si ya existe la suscripción
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint }
    });

    if (existing) {
      // Actualizar si pertenece al mismo usuario
      if (existing.userId === userId) {
        return res.json({
          success: true,
          message: 'Suscripción ya registrada',
          data: existing
        });
      }
      // Si pertenece a otro usuario, actualizar dueño
      const updated = await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { userId, keys }
      });
      return res.json({
        success: true,
        message: 'Suscripción actualizada',
        data: updated
      });
    }

    // Crear nueva suscripción
    const subscription = await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint,
        keys
      }
    });

    res.status(201).json({
      success: true,
      message: 'Suscripción registrada exitosamente',
      data: subscription
    });
  } catch (error) {
    console.error('Subscribe push error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar suscripción'
    });
  }
};

/**
 * Eliminar suscripción push del usuario
 * DELETE /api/push/subscribe
 */
const unsubscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint requerido'
      });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint
      }
    });

    res.json({
      success: true,
      message: 'Suscripción eliminada'
    });
  } catch (error) {
    console.error('Unsubscribe push error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar suscripción'
    });
  }
};

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe
};