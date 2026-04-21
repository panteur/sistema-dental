const express = require('express');
const { body, param } = require('express-validator');
const PatientController = require('../controllers/patient.controller');
const { authenticate, isAdminOrReceptionist, isAdminOrDentistOrReceptionist } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', isAdminOrDentistOrReceptionist, PatientController.getAll);

router.get('/:id',
  validate([param('id').isInt()]),
  PatientController.getById
);

router.get('/:id/appointments',
  validate([param('id').isInt()]),
  PatientController.getAppointments
);

router.post('/',
  isAdminOrReceptionist,
  validate([
    body('dni').trim().notEmpty(),
    body('name').trim().notEmpty(),
    body('last_name').trim().notEmpty(),
    body('phone').trim().notEmpty()
  ]),
  PatientController.create
);

router.put('/:id',
  isAdminOrReceptionist,
  validate([param('id').isInt()]),
  PatientController.update
);

router.delete('/:id',
  isAdminOrReceptionist,
  validate([param('id').isInt()]),
  PatientController.delete
);

module.exports = router;
