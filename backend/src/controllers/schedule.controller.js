const Schedule = require('../models/schedule.model');
const { AppError } = require('../middleware/error.middleware');

class ScheduleController {
  static async getAll(req, res, next) {
    try {
      const { user_id, day_of_week, active } = req.query;
      const schedules = await Schedule.findAll({ user_id, day_of_week, active });
      res.json({ schedules });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const schedule = await Schedule.findById(req.params.id);
      if (!schedule) {
        throw new AppError('Horario no encontrado', 404);
      }
      res.json({ schedule });
    } catch (error) {
      next(error);
    }
  }

  static async getByUser(req, res, next) {
    try {
      const schedules = await Schedule.findByUser(req.params.userId);
      res.json({ schedules });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const scheduleId = await Schedule.create(req.body);
      const schedule = await Schedule.findById(scheduleId);
      res.status(201).json({ message: 'Horario creado', schedule });
    } catch (error) {
      next(error);
    }
  }

  static async bulkCreate(req, res, next) {
    try {
      const { user_id, schedules } = req.body;
      
      if (!user_id || !schedules || !Array.isArray(schedules)) {
        throw new AppError('Se requiere user_id y un array de schedules', 400);
      }

      await Schedule.bulkCreate(user_id, schedules);
      const createdSchedules = await Schedule.findByUser(user_id);
      res.status(201).json({ message: 'Horarios creados', schedules: createdSchedules });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const schedule = await Schedule.findById(req.params.id);
      if (!schedule) {
        throw new AppError('Horario no encontrado', 404);
      }

      await Schedule.update(req.params.id, req.body);
      const updatedSchedule = await Schedule.findById(req.params.id);
      res.json({ message: 'Horario actualizado', schedule: updatedSchedule });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const schedule = await Schedule.findById(req.params.id);
      if (!schedule) {
        throw new AppError('Horario no encontrado', 404);
      }

      await Schedule.delete(req.params.id);
      res.json({ message: 'Horario eliminado' });
    } catch (error) {
      next(error);
    }
  }

  static async getAvailableSlots(req, res, next) {
    try {
      const { dentist_id, date } = req.query;
      
      if (!dentist_id || !date) {
        throw new AppError('Se requiere dentist_id y date', 400);
      }

      const dayOfWeek = new Date(date).getDay();
      const schedule = await Schedule.findByDay(parseInt(dentist_id), dayOfWeek);
      
      if (!schedule) {
        return res.json({ slots: [], message: 'El dentista no trabaja este día' });
      }

      const slots = [];
      const startTime = schedule.start_time.split(':').map(Number);
      const endTime = schedule.end_time.split(':').map(Number);
      const breakStart = schedule.break_start ? schedule.break_start.split(':').map(Number) : null;
      const breakEnd = schedule.break_end ? schedule.break_end.split(':').map(Number) : null;

      let currentHour = startTime[0];
      let currentMinute = startTime[1];

      while (currentHour < endTime[0] || (currentHour === endTime[0] && currentMinute < endTime[1])) {
        const isBreak = breakStart && breakEnd && (
          (currentHour > breakStart[0] || (currentHour === breakStart[0] && currentMinute >= breakStart[1])) &&
          (currentHour < breakEnd[0] || (currentHour === breakEnd[0] && currentMinute < breakEnd[1]))
        );

        if (!isBreak) {
          const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          slots.push(timeStr);
        }

        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour++;
        }
      }

      res.json({ slots, schedule });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ScheduleController;
