const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middlewares/auth');
const {
  logHabitToday,
  getHabitLogs,
  getDashboard,
  getWeeklySummary,
  getStreak
} = require('../controllers/logController');

const router = express.Router();

// ============================================
// VALIDACIONES
// ============================================

const logValidation = [
  param('id')
    .isInt()
    .withMessage('ID de hábito inválido'),
  
  body('status')
    .isIn(['COMPLETED', 'SKIPPED', 'FAILED'])
    .withMessage('Estado inválido. Debe ser: COMPLETED, SKIPPED o FAILED'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres')
];

const getLogsValidation = [
  param('id')
    .isInt()
    .withMessage('ID de hábito inválido'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser entre 1 y 100')
];

// ============================================
// RUTAS (TODAS PROTEGIDAS)
// ============================================

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Dashboard y resúmenes
router.get('/dashboard', getDashboard);
router.get('/dashboard/weekly', getWeeklySummary);
router.get('/dashboard/streak', getStreak);

// Logs de hábitos
router.post('/habits/:id/log', logValidation, logHabitToday);
router.get('/habits/:id/logs', getLogsValidation, getHabitLogs);

module.exports = router;