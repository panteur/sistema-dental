const Service = require('../models/service.model');
const { AppError } = require('../middleware/error.middleware');

class ServiceController {
  static async getAll(req, res, next) {
    try {
      const { active, search } = req.query;
      const services = await Service.findAll({ 
        active: active !== undefined ? active === 'true' : true,
        search 
      });
      res.json({ services });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const service = await Service.findById(req.params.id);
      if (!service) {
        throw new AppError('Servicio no encontrado', 404);
      }
      res.json({ service });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const serviceId = await Service.create(req.body);
      const service = await Service.findById(serviceId);
      res.status(201).json({ message: 'Servicio creado', service });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const service = await Service.findById(req.params.id);
      if (!service) {
        throw new AppError('Servicio no encontrado', 404);
      }

      await Service.update(req.params.id, req.body);
      const updatedService = await Service.findById(req.params.id);
      res.json({ message: 'Servicio actualizado', service: updatedService });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const service = await Service.findById(req.params.id);
      if (!service) {
        throw new AppError('Servicio no encontrado', 404);
      }

      await Service.delete(req.params.id);
      res.json({ message: 'Servicio eliminado' });
    } catch (error) {
      next(error);
    }
  }

  static async toggleActive(req, res, next) {
    try {
      const service = await Service.findById(req.params.id);
      if (!service) {
        throw new AppError('Servicio no encontrado', 404);
      }

      await Service.toggleActive(req.params.id);
      const updatedService = await Service.findById(req.params.id);
      res.json({ message: 'Servicio actualizado', service: updatedService });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ServiceController;
