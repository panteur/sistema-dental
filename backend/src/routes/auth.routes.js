const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.post('/register',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').optional().isIn(['admin', 'dentista', 'recepcionista'])
  ]),
  AuthController.register
);

router.post('/login',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ]),
  AuthController.login
);

router.get('/me', authenticate, AuthController.me);

router.post('/change-password',
  authenticate,
  validate([
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ]),
  AuthController.changePassword
);

router.post('/forgot-password',
  validate([
    body('email').isEmail().normalizeEmail()
  ]),
  AuthController.forgotPassword
);

router.post('/reset-password',
  validate([
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
    body('confirmPassword').notEmpty()
  ]),
  AuthController.resetPassword
);

module.exports = router;
