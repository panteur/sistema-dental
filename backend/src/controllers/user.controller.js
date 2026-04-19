const User = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');

class UserController {
  static async getAll(req, res, next) {
    try {
      const { role, search, limit } = req.query;
      const users = await User.findAll({ role, search, limit });
      res.json({ users });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const userId = await User.create(req.body);
      const user = await User.findById(userId);
      res.status(201).json({ message: 'Usuario creado', user });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('rut')) {
          next(new AppError('El RUT ya está registrado', 400));
        } else {
          next(new AppError('El email ya está registrado', 400));
        }
      } else {
        next(error);
      }
    }
  }

  static async update(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      await User.update(req.params.id, req.body);
      const updatedUser = await User.findById(req.params.id);
      res.json({ message: 'Usuario actualizado', user: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      await User.delete(req.params.id);
      res.json({ message: 'Usuario eliminado' });
    } catch (error) {
      next(error);
    }
  }

  static async getDentists(req, res, next) {
    try {
      const { ROLES } = require('../config/constants');
      const dentists = await User.findAll({ role: ROLES.DENTIST });
      res.json({ dentists });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
