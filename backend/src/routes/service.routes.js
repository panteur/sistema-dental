const express = require('express');
const { body, param } = require('express-validator');
const ServiceController = require('../controllers/service.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', ServiceController.getAll);

router.get('/:id',
  validate([param('id').isInt()]),
  ServiceController.getById
);

router.post('/',
  isAdmin,
  validate([
    body('name').trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('duration').optional().isInt({ min: 5 })
  ]),
  ServiceController.create
);

router.put('/:id',
  isAdmin,
  validate([param('id').isInt()]),
  ServiceController.update
);

router.patch('/:id/toggle',
  isAdmin,
  validate([param('id').isInt()]),
  ServiceController.toggleActive
);

router.delete('/:id',
  isAdmin,
  validate([param('id').isInt()]),
  ServiceController.delete
);

module.exports = router;
