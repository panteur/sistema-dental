const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');
const emailService = require('../services/email.service');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, name, role, phone, specialty } = req.body;

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new AppError('El email ya está registrado', 400);
      }

      const userId = await User.create({
        email,
        password,
        name,
        role: role || 'recepcionista',
        phone,
        specialty
      });

      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: userId,
          email,
          name,
          role: role || 'recepcionista'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        throw new AppError('Credenciales inválidas', 401);
      }

      if (user.active === 0 || user.active === false) {
        throw new AppError('Usuario desactivado. Contacte al administrador', 401);
      }

      const isValidPassword = await User.comparePassword(password, user.password);
      if (!isValidPassword) {
        throw new AppError('Credenciales inválidas', 401);
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        message: 'Login exitoso',
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findByEmail(req.user.email);
      const isValidPassword = await User.comparePassword(currentPassword, user.password);
      
      if (!isValidPassword) {
        throw new AppError('Contraseña actual incorrecta', 400);
      }

      await User.update(req.user.id, { password: newPassword });
      
      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.json({ message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      await User.setResetToken(email, resetToken);

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      await emailService.sendPasswordResetEmail(user, resetToken, resetUrl);

      res.json({ message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.' });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        throw new AppError('Las contraseñas no coinciden', 400);
      }

      const user = await User.findByResetToken(token);
      if (!user) {
        throw new AppError('El enlace de recuperación es inválido o ha expirado', 400);
      }

      await User.updatePassword(user.id, password);

      await emailService.sendPasswordChangedEmail(user);

      res.json({ message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
