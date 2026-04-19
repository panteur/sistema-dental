const ROLES = {
  ADMIN: 'admin',
  DENTIST: 'dentista',
  RECEPTIONIST: 'recepcionista'
};

const STATUS = {
  PENDING: 'pendiente',
  CONFIRMED: 'confirmada',
  CANCELLED: 'cancelada',
  COMPLETED: 'completada',
  NO_SHOW: 'no_presento'
};

const APPOINTMENT_TYPES = {
  NEW: 'nueva',
  FOLLOW_UP: 'seguimiento',
  EMERGENCY: 'urgencia'
};

module.exports = { ROLES, STATUS, APPOINTMENT_TYPES };
