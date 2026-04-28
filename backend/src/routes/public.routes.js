const express = require('express');
const { body } = require('express-validator');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const { APPOINTMENT_TYPES } = require('../config/constants');
const { AppError } = require('../middleware/error.middleware');
const { validate } = require('../middleware/validate.middleware');
const emailService = require('../services/email.service');

const router = express.Router();

router.post('/contact',
  validate([
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('message').trim().notEmpty().withMessage('El mensaje es requerido')
  ]),
  async (req, res, next) => {
    try {
      const { name, email, phone, message } = req.body;
      
      await emailService.sendContactEmail({ name, email, phone, message });
      
      res.status(201).json({
        message: 'Mensaje recibido correctamente',
        success: true
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/register',
  validate([
    body('dni').trim().notEmpty(),
    body('name').trim().notEmpty(),
    body('last_name').trim().notEmpty(),
    body('phone').trim().notEmpty()
  ]),
  async (req, res, next) => {
    try {
      const { dni, name, last_name, email, phone } = req.body;

      let patient = await Patient.findByDni(dni);
      
      if (!patient) {
        const patientId = await Patient.create({
          dni,
          name,
          last_name,
          email: email || null,
          phone
        });
        patient = await Patient.findById(patientId);
      }

      res.status(201).json({
        message: 'Paciente registrado exitosamente',
        patient
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/appointment',
  validate([
    body('dni').trim().notEmpty(),
    body('name').trim().notEmpty(),
    body('last_name').trim().notEmpty(),
    body('phone').trim().notEmpty(),
    body('dentist_id').isInt(),
    body('service_id').isInt(),
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ]),
  async (req, res, next) => {
    try {
      const { dni, name, last_name, email, phone, dentist_id, service_id, date, time, notes } = req.body;

      const Service = require('../models/service.model');
      const service = await Service.findById(service_id);
      if (!service) {
        throw new AppError('Servicio no encontrado', 404);
      }
      const serviceDuration = service.duration || 30;

      let patient = await Patient.findByDni(dni);
      
      if (!patient) {
        const patientId = await Patient.create({
          dni,
          name,
          last_name,
          email: email || null,
          phone
        });
        patient = await Patient.findById(patientId);
      }

      const isAvailable = await Appointment.checkAvailability(dentist_id, date, time, serviceDuration);
      if (!isAvailable) {
        throw new AppError('El horario seleccionado no está disponible', 400);
      }

      const appointmentId = await Appointment.create({
        patient_id: patient.id,
        dentist_id,
        service_id,
        date,
        time,
        duration: serviceDuration,
        type: APPOINTMENT_TYPES.NEW,
        notes: notes || null
      });

      const appointment = await Appointment.findById(appointmentId);

      emailService.sendAppointmentConfirmation(appointment, patient);

      res.status(201).json({
        message: 'Cita agendada exitosamente',
        appointment,
        patient
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/services', async (req, res, next) => {
  try {
    const Service = require('../models/service.model');
    const services = await Service.findAll({ active: true });
    res.json({ services });
  } catch (error) {
    next(error);
  }
});

router.get('/dentists', async (req, res, next) => {
  try {
    const User = require('../models/user.model');
    const Schedule = require('../models/schedule.model');
    const { ROLES } = require('../config/constants');
    const dentists = await User.findAll({ role: ROLES.DENTIST });
    
    for (const dentist of dentists) {
      const schedule = await Schedule.findByDentist(dentist.id);
      dentist.schedule = schedule;
    }
    
    res.json({ dentists });
  } catch (error) {
    next(error);
  }
});

router.get('/dentists/:id/schedule', async (req, res, next) => {
  try {
    const Schedule = require('../models/schedule.model');
    const schedule = await Schedule.findByDentist(parseInt(req.params.id));
    res.json({ schedule });
  } catch (error) {
    next(error);
  }
});

router.get('/slots', async (req, res, next) => {
  try {
    const { dentist_id, date, service_id } = req.query;
    
    if (!dentist_id || !date) {
      throw new AppError('Se requiere dentist_id y date', 400);
    }

    const Schedule = require('../models/schedule.model');
    const Appointment = require('../models/appointment.model');
    const Service = require('../models/service.model');
    
    const serviceDuration = service_id ? (await Service.findById(parseInt(service_id))?.duration || 30) : 30;
    const slotInterval = 30;
    
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const schedule = await Schedule.findByDay(parseInt(dentist_id), dayOfWeek);
    
    if (!schedule) {
      return res.json({ slots: [], bookedSlots: [], message: 'El dentista no atiende este día' });
    }

    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    const now = new Date();
    
    const existingAppointments = await Appointment.findAll({ 
      dentist_id: parseInt(dentist_id), 
      date 
    });
    
    const bookedSlots = existingAppointments
      .filter(a => a.status === 'confirmada' || a.status === 'pendiente')
      .map(a => {
        const [h, m] = a.time.split(':').map(Number);
        return { time: `${h}:${m.toString().padStart(2, '0')}`, duration: a.service_duration || a.duration || 30 };
      });

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
        
        if (isToday) {
          const slotHour = currentHour;
          const slotMinute = currentMinute;
          const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotHour, slotMinute);
          if (slotDate <= now) {
            currentMinute += slotInterval;
            if (currentMinute >= 60) { currentMinute = 0; currentHour++; }
            continue;
          }
        }

        const slotEnd = currentMinute + serviceDuration;
        const slotEndHour = currentHour + Math.floor(slotEnd / 60);
        const slotEndMinute = slotEnd % 60;
        
        const schedEndMinutes = endTime[0] * 60 + endTime[1];
        const slotEndMinutes = slotEndHour * 60 + slotEndMinute;
        if (slotEndMinutes > schedEndMinutes) {
          currentMinute += slotInterval;
          if (currentMinute >= 60) { currentMinute = 0; currentHour++; }
          continue;
        }

        const overlaps = bookedSlots.some(booked => {
          const [bh, bm] = booked.time.split(':').map(Number);
          const bookedStart = bh * 60 + bm;
          const bookedEnd = bookedStart + booked.duration;
          const currentStart = currentHour * 60 + currentMinute;
          const currentEnd = currentStart + serviceDuration;
          return currentStart < bookedEnd && currentEnd > bookedStart;
        });

        if (!overlaps) {
          slots.push(timeStr);
        }
      }

      currentMinute += slotInterval;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    res.json({ slots, bookedSlots, schedule, serviceDuration });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
