const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { generateToken } = require('../config/jwt');

const prisma = new PrismaClient();

/**
 * Registrar un nuevo usuario
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    // Validar errores de express-validator
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

    const { email, password, name } = req.body;

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim()
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // Generar token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      code: 'REGISTER_ERROR'
    });
  }
};

/**
 * Iniciar sesión
 * POST /api/auth/login
 */
const login = async (req, res) => {
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

    const { email, password } = req.body;

    // Buscar usuario incluyendo la contraseña
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generar token
    const token = generateToken(user.id, user.email);

    // Excluir password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      code: 'LOGIN_ERROR'
    });
  }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    // El usuario ya está en req.user gracias al middleware authenticate
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            habits: true,
            logs: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
};

/**
 * Actualizar perfil del usuario
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Verificar si el email ya está en uso (si se está cambiando)
    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase() })
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil'
    });
  }
};

/**
 * Cambiar contraseña
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Obtener usuario con contraseña actual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};