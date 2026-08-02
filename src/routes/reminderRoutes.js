const express = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middlewares/auth');
const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder
} = require('../controllers/reminderController');

const router = express.Router();

// Validaciones
const createReminderValidation = [
  body('habitId')
    .isInt()
    .withMessage('ID de hábito inválido'),
  body('time')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora inválido (HH:MM)'),
  body('days')
    .optional()
    .matches(/^([1-7](,[1-7])*)?$/)
    .withMessage('Días inválidos (formato: 1,3,5)'),
  body('type')
    .optional()
    .isIn(['EMAIL', 'PUSH', 'BOTH'])
    .withMessage('Tipo inválido')
];

const updateReminderValidation = [
  param('id')
    .isInt()
    .withMessage('ID inválido'),
  body('time')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora inválido (HH:MM)'),
  body('days')
    .optional()
    .matches(/^([1-7](,[1-7])*)?$/)
    .withMessage('Días inválidos (formato: 1,3,5)'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active debe ser booleano'),
  body('type')
    .optional()
    .isIn(['EMAIL', 'PUSH', 'BOTH'])
    .withMessage('Tipo inválido')
];

// Rutas
router.use(authenticate);

router.get('/', getReminders);
router.post('/', createReminderValidation, createReminder);
router.put('/:id', updateReminderValidation, updateReminder);
router.delete('/:id', deleteReminder);

module.exports = router;