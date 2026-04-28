const express = require('express');
const { body, param } = require('express-validator');
const UserController = require('../controllers/user.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', UserController.getAll);
router.get('/dentists', UserController.getDentists);

router.get('/:id',
  validate([param('id').isInt()]),
  UserController.getById
);

router.post('/',
  isAdmin,
  validate([
    body('rut').optional().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').isIn(['admin', 'dentista', 'recepcionista'])
  ]),
  UserController.create
);

router.put('/:id',
  isAdmin,
  validate([param('id').isInt()]),
  UserController.update
);

router.patch('/:id/toggle-active',
  isAdmin,
  validate([param('id').isInt()]),
  UserController.toggleActive
);

router.delete('/:id',
  isAdmin,
  validate([param('id').isInt()]),
  UserController.delete
);

module.exports = router;
