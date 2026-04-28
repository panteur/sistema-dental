const { query } = require('../config/database');

class Schedule {
  static async create(scheduleData) {
    const result = await query(
      `INSERT INTO schedules (user_id, day_of_week, start_time, end_time, break_start, break_end, active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        scheduleData.user_id,
        scheduleData.day_of_week,
        scheduleData.start_time,
        scheduleData.end_time,
        scheduleData.break_start || null,
        scheduleData.break_end || null,
        scheduleData.active !== false
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const schedules = await query(
      `SELECT s.*, u.name as dentist_name 
       FROM schedules s 
       LEFT JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [id]
    );
    return schedules[0] || null;
  }

  static async findByUser(userId) {
    return query(
      `SELECT s.*, u.name as dentist_name 
       FROM schedules s 
       LEFT JOIN users u ON s.user_id = u.id 
       WHERE s.user_id = ? 
       ORDER BY s.day_of_week`,
      [userId]
    );
  }

  static async findByDentist(dentistId) {
    return query(
      `SELECT * FROM schedules WHERE user_id = ? AND active = true ORDER BY day_of_week`,
      [dentistId]
    );
  }

  static async findByDay(userId, dayOfWeek) {
    const schedules = await query(
      `SELECT * FROM schedules WHERE user_id = ? AND day_of_week = ? AND active = true`,
      [userId, dayOfWeek]
    );
    return schedules[0] || null;
  }

  static async findAll(filters = {}) {
    let sql = `SELECT s.*, u.name as dentist_name, u.specialty 
               FROM schedules s 
               LEFT JOIN users u ON s.user_id = u.id 
               WHERE 1=1`;
    const params = [];

    if (filters.user_id) {
      sql += ' AND s.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.day_of_week !== undefined) {
      sql += ' AND s.day_of_week = ?';
      params.push(filters.day_of_week);
    }

    if (filters.active !== undefined) {
      sql += ' AND s.active = ?';
      params.push(filters.active);
    }

    sql += ' ORDER BY s.user_id, s.day_of_week';

    return query(sql, params);
  }

  static async update(id, scheduleData) {
    const updates = [];
    const params = [];

    const fields = ['day_of_week', 'start_time', 'end_time', 'break_start', 'break_end', 'active'];
    
    for (const field of fields) {
      if (scheduleData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(scheduleData[field]);
      }
    }

    if (updates.length === 0) return false;

    params.push(id);
    const result = await query(`UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const result = await query('DELETE FROM schedules WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async bulkCreate(userId, schedules) {
    for (const schedule of schedules) {
      await this.create({ ...schedule, user_id: userId });
    }
    return true;
  }
}

module.exports = Schedule;
