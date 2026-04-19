const express = require('express');
const { body, param } = require('express-validator');
const AppointmentController = require('../controllers/appointment.controller');
const { authenticate, isAdminOrDentistOrReceptionist } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', isAdminOrDentistOrReceptionist, AppointmentController.getAll);
router.get('/stats', isAdminOrDentistOrReceptionist, AppointmentController.getStats);
router.get('/by-date', isAdminOrDentistOrReceptionist, AppointmentController.getByDate);
router.get('/by-range', isAdminOrDentistOrReceptionist, AppointmentController.getByDateRange);

router.get('/:id',
  validate([param('id').isInt()]),
  AppointmentController.getById
);

router.post('/',
  isAdminOrDentistOrReceptionist,
  validate([
    body('patient_id').isInt(),
    body('dentist_id').isInt(),
    body('service_id').isInt(),
    body('date').isDate(),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ]),
  AppointmentController.create
);

router.post('/with-patient',
  isAdminOrDentistOrReceptionist,
  validate([
    body('dni').notEmpty().withMessage('DNI es requerido'),
    body('patient_name').notEmpty().withMessage('Nombre del paciente es requerido'),
    body('patient_last_name').notEmpty().withMessage('Apellido del paciente es requerido'),
    body('patient_phone').notEmpty().withMessage('Teléfono es requerido'),
    body('dentist_id').isInt(),
    body('service_id').isInt(),
    body('date').isDate(),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ]),
  AppointmentController.createWithPatient
);

router.put('/:id',
  isAdminOrDentistOrReceptionist,
  validate([param('id').isInt()]),
  AppointmentController.update
);

router.patch('/:id/status',
  isAdminOrDentistOrReceptionist,
  validate([
    param('id').isInt(),
    body('status').isIn(['pendiente', 'confirmada', 'cancelada', 'completada', 'no_presento'])
  ]),
  AppointmentController.updateStatus
);

router.delete('/:id',
  isAdminOrDentistOrReceptionist,
  validate([param('id').isInt()]),
  AppointmentController.delete
);

module.exports = router;
