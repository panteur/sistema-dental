const express = require('express');
const { body, param } = require('express-validator');
const ScheduleController = require('../controllers/schedule.controller');
const { authenticate, isAdminOrDentist } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', isAdminOrDentist, ScheduleController.getAll);
router.get('/slots', isAdminOrDentist, ScheduleController.getAvailableSlots);
router.get('/user/:userId', ScheduleController.getByUser);

router.get('/:id',
  validate([param('id').isInt()]),
  ScheduleController.getById
);

router.post('/',
  isAdminOrDentist,
  validate([
    body('user_id').isInt(),
    body('day_of_week').isInt({ min: 0, max: 6 }),
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ]),
  ScheduleController.create
);

router.post('/bulk',
  isAdminOrDentist,
  ScheduleController.bulkCreate
);

router.put('/:id',
  isAdminOrDentist,
  validate([param('id').isInt()]),
  ScheduleController.update
);

router.delete('/:id',
  isAdminOrDentist,
  validate([param('id').isInt()]),
  ScheduleController.delete
);

module.exports = router;
