const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// ============================================
// VALIDACIONES
// ============================================

const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email demasiado largo'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/[A-Z]/)
    .withMessage('Debe contener al menos una mayúscula')
    .matches(/[a-z]/)
    .withMessage('Debe contener al menos una minúscula')
    .matches(/[0-9]/)
    .withMessage('Debe contener al menos un número')
    .not()
    .matches(/^[0-9]+$/)
    .withMessage('No puede ser solo números'),
  
  body('name')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/[A-Z]/)
    .withMessage('Debe contener al menos una mayúscula')
    .matches(/[0-9]/)
    .withMessage('Debe contener al menos un número')
];

// ============================================
// RUTAS PÚBLICAS
// ============================================

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, changePassword);

module.exports = router;