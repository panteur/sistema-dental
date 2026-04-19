const { query } = require('../config/database');
const { STATUS, APPOINTMENT_TYPES } = require('../config/constants');

class Appointment {
  static async create(appointmentData) {
    const result = await query(
      `INSERT INTO appointments (patient_id, dentist_id, service_id, date, time, duration, type, status, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        appointmentData.patient_id,
        appointmentData.dentist_id,
        appointmentData.service_id,
        appointmentData.date,
        appointmentData.time,
        appointmentData.duration || 30,
        appointmentData.type || APPOINTMENT_TYPES.NEW,
        appointmentData.status || STATUS.PENDING,
        appointmentData.notes || null
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const appointments = await query(
      `SELECT a.*, 
              p.name as patient_name, p.last_name as patient_last_name, p.phone as patient_phone, p.dni as patient_dni, p.email as patient_email,
              u.name as dentist_name, u.specialty as dentist_specialty,
              s.name as service_name, s.price as service_price, s.duration as service_duration
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN users u ON a.dentist_id = u.id
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id]
    );
    return appointments[0] || null;
  }

  static async findAll(filters = {}) {
    let sql = `SELECT a.*, 
                      p.name as patient_name, p.last_name as patient_last_name,
                      u.name as dentist_name, u.specialty as dentist_specialty,
                      s.name as service_name
               FROM appointments a
               LEFT JOIN patients p ON a.patient_id = p.id
               LEFT JOIN users u ON a.dentist_id = u.id
               LEFT JOIN services s ON a.service_id = s.id
               WHERE 1=1`;
    const params = [];

    if (filters.dentist_id) {
      sql += ' AND a.dentist_id = ?';
      params.push(filters.dentist_id);
    }

    if (filters.patient_id) {
      sql += ' AND a.patient_id = ?';
      params.push(filters.patient_id);
    }

    if (filters.status) {
      sql += ' AND a.status = ?';
      params.push(filters.status);
    }

    if (filters.date_from) {
      sql += ' AND a.date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ' AND a.date <= ?';
      params.push(filters.date_to);
    }

    if (filters.date) {
      sql += ' AND a.date = ?';
      params.push(filters.date);
    }

    sql += ' ORDER BY a.date DESC, a.time DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    return query(sql, params);
  }

  static async update(id, appointmentData) {
    const updates = [];
    const params = [];

    const fields = ['dentist_id', 'service_id', 'date', 'time', 'duration', 'type', 'status', 'notes'];
    
    for (const field of fields) {
      if (appointmentData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(appointmentData[field]);
      }
    }

    if (updates.length === 0) return false;

    params.push(id);
    const result = await query(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, params);
    return result.affectedRows > 0;
  }

  static async updateStatus(id, status) {
    const result = await query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const result = await query('DELETE FROM appointments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async checkAvailability(dentistId, date, time, serviceDuration = 30, excludeId = null) {
    const [h, m] = time.split(':').map(Number);
    const newStart = h * 60 + m;
    const newEnd = newStart + serviceDuration;

    let sql = `SELECT id, time, duration FROM appointments WHERE dentist_id = ? AND date = ? AND status != ?`;
    const params = [dentistId, date, STATUS.CANCELLED];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const existingAppointments = await query(sql, params);

    for (const apt of existingAppointments) {

      const [ah, am] = apt.time.split(':').map(Number);
      const aptStart = ah * 60 + am;
      const aptDuration = apt.duration || 30;
      const aptEnd = aptStart + aptDuration;

      if (newStart < aptEnd && newEnd > aptStart) {
        return false;
      }
    }

    return true;
  }

  static async getByDateRange(filters = {}) {
    let sql = `SELECT a.*,
                      p.name as patient_name, p.last_name as patient_last_name, p.phone as patient_phone,
                      u.name as dentist_name, u.specialty as dentist_specialty,
                      s.name as service_name, s.duration as service_duration
               FROM appointments a
               LEFT JOIN patients p ON a.patient_id = p.id
               LEFT JOIN users u ON a.dentist_id = u.id
               LEFT JOIN services s ON a.service_id = s.id
               WHERE 1=1`;
    const params = [];

    if (filters.dentist_id) {
      sql += ' AND a.dentist_id = ?';
      params.push(filters.dentist_id);
    }

    sql += ' AND a.date >= CAST(? AS DATE) AND a.date <= CAST(? AS DATE)';
    params.push(filters.start_date, filters.end_date);

    sql += ' AND a.status != ?';
    params.push(STATUS.CANCELLED);

    sql += ' ORDER BY a.date ASC, a.time ASC';
    return query(sql, params);
  }

  static async getStats(filters = {}) {
    let sql = `SELECT 
                 COUNT(*) as total,
                 SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending,
                 SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as confirmed,
                 SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed,
                 SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled
               FROM appointments WHERE 1=1`;
    const params = [STATUS.PENDING, STATUS.CONFIRMED, STATUS.COMPLETED, STATUS.CANCELLED];

    if (filters.dentist_id) {
      sql += ' AND dentist_id = ?';
      params.push(filters.dentist_id);
    }

    if (filters.date_from) {
      sql += ' AND date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      sql += ' AND date <= ?';
      params.push(filters.date_to);
    }

    const result = await query(sql, params);
    return result[0];
  }
}

module.exports = Appointment;
