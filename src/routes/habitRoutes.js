const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middlewares/auth');
const {
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  getHabitStats
} = require('../controllers/habitController');

const router = express.Router();

// ============================================
// VALIDACIONES
// ============================================

const createHabitValidation = [
  body('name')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres')
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras, números y espacios'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  
  body('frequency')
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY'])
    .withMessage('Frecuencia inválida. Debe ser: DAILY, WEEKLY o MONTHLY'),
  
  body('targetDays')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Los días objetivo deben ser entre 1 y 7'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color inválido. Debe ser formato hexadecimal (#RRGGBB)'),
  
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('El icono no puede exceder 10 caracteres')
];

const updateHabitValidation = [
  param('id')
    .isInt()
    .withMessage('ID inválido'),
  
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres')
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras, números y espacios'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  
  body('frequency')
    .optional()
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY'])
    .withMessage('Frecuencia inválida. Debe ser: DAILY, WEEKLY o MONTHLY'),
  
  body('targetDays')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Los días objetivo deben ser entre 1 y 7'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color inválido. Debe ser formato hexadecimal (#RRGGBB)'),
  
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('El icono no puede exceder 10 caracteres')
];

const habitIdValidation = [
  param('id')
    .isInt()
    .withMessage('ID inválido')
];

const statsValidation = [
  param('id')
    .isInt()
    .withMessage('ID inválido'),
  query('days')
    .optional()
    .isInt({ min: 7, max: 90 })
    .withMessage('Los días deben ser entre 7 y 90')
];

// ============================================
// RUTAS (TODAS PROTEGIDAS)
// ============================================

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Rutas principales
router.get('/', getHabits);
router.post('/', createHabitValidation, createHabit);

// Rutas con ID
router.get('/:id', habitIdValidation, getHabitById);
router.put('/:id', updateHabitValidation, updateHabit);
router.delete('/:id', habitIdValidation, deleteHabit);

// Estadísticas
router.get('/:id/stats', statsValidation, getHabitStats);

module.exports = router;