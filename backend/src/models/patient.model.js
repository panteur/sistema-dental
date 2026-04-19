const { query } = require('../config/database');

class Patient {
  static async create(patientData) {
    const result = await query(
      `INSERT INTO patients (dni, name, last_name, email, phone, address, date_of_birth, gender, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        patientData.dni,
        patientData.name,
        patientData.last_name,
        patientData.email || null,
        patientData.phone,
        patientData.address || null,
        patientData.date_of_birth || null,
        patientData.gender || null,
        patientData.notes || null
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const patients = await query('SELECT * FROM patients WHERE id = ?', [id]);
    return patients[0] || null;
  }

  static async findByDni(dni) {
    const patients = await query('SELECT * FROM patients WHERE dni = ?', [dni]);
    return patients[0] || null;
  }

  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM patients WHERE 1=1';
    const params = [];

    if (filters.search) {
      sql += ' AND (name LIKE ? OR last_name LIKE ? OR dni LIKE ? OR email LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.dentist_id) {
      sql += ' AND id IN (SELECT patient_id FROM appointments WHERE dentist_id = ?)';
      params.push(filters.dentist_id);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    return query(sql, params);
  }

  static async update(id, patientData) {
    const updates = [];
    const params = [];

    const fields = ['name', 'last_name', 'email', 'phone', 'address', 'date_of_birth', 'gender', 'notes'];
    
    for (const field of fields) {
      if (patientData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(patientData[field]);
      }
    }

    if (updates.length === 0) return false;

    params.push(id);
    const result = await query(`UPDATE patients SET ${updates.join(', ')} WHERE id = ?`, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const result = await query('DELETE FROM patients WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getAppointments(patientId) {
    return query(
      `SELECT a.*, u.name as dentist_name, s.name as service_name 
       FROM appointments a 
       LEFT JOIN users u ON a.dentist_id = u.id 
       LEFT JOIN services s ON a.service_id = s.id 
       WHERE a.patient_id = ? 
       ORDER BY a.date DESC`,
      [patientId]
    );
  }
}

module.exports = Patient;
