const { verifyToken } = require('../config/jwt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware para autenticar usuarios vía JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // 2. Verificar token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error.message === 'Token expirado') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado, por favor inicia sesión nuevamente',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    // 3. Verificar que el usuario exista
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // 4. Adjuntar usuario al request
    req.user = user;
    req.token = token;
    req.tokenData = decoded;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware para autorización por roles (si lo necesitas)
 * @param {...string} roles - Roles permitidos
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Si no hay roles definidos, permitir acceso
    if (roles.length === 0) {
      return next();
    }

    // Verificar rol (si tienes campo role en el usuario)
    // Por ahora, permitimos todos
    next();
  };
};

/**
 * Middleware opcional para verificar si el usuario es propietario del recurso
 */
const isOwner = (getResourceId) => {
  return async (req, res, next) => {
    try {
      const resourceId = getResourceId(req);
      // Aquí verificas si el usuario es propietario del recurso
      // Ejemplo: const habit = await prisma.habit.findUnique({ where: { id: resourceId } });
      // if (habit.userId !== req.user.id) return res.status(403).json(...)
      next();
    } catch (error) {
      res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a este recurso'
      });
    }
  };
};

module.exports = { authenticate, authorize, isOwner };