const Patient = require('../models/patient.model');
const { AppError } = require('../middleware/error.middleware');

class PatientController {
  static async getAll(req, res, next) {
    try {
      const { search, dentist_id, limit } = req.query;
      const patients = await Patient.findAll({ search, dentist_id, limit });
      res.json({ patients });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        throw new AppError('Paciente no encontrado', 404);
      }
      res.json({ patient });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const existingPatient = await Patient.findByDni(req.body.dni);
      if (existingPatient) {
        throw new AppError('Ya existe un paciente con este DNI', 400);
      }

      const patientId = await Patient.create(req.body);
      const patient = await Patient.findById(patientId);
      res.status(201).json({ message: 'Paciente creado', patient });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        throw new AppError('Paciente no encontrado', 404);
      }

      await Patient.update(req.params.id, req.body);
      const updatedPatient = await Patient.findById(req.params.id);
      res.json({ message: 'Paciente actualizado', patient: updatedPatient });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        throw new AppError('Paciente no encontrado', 404);
      }

      await Patient.delete(req.params.id);
      res.json({ message: 'Paciente eliminado' });
    } catch (error) {
      next(error);
    }
  }

  static async getAppointments(req, res, next) {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        throw new AppError('Paciente no encontrado', 404);
      }

      const appointments = await Patient.getAppointments(req.params.id);
      res.json({ appointments });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientController;
