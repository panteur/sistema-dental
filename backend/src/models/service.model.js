const { query } = require('../config/database');

class Service {
  static async create(serviceData) {
    const result = await query(
      `INSERT INTO services (name, description, price, duration, active, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        serviceData.name,
        serviceData.description || null,
        serviceData.price || 0,
        serviceData.duration || 30,
        serviceData.active !== false
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const services = await query('SELECT * FROM services WHERE id = ?', [id]);
    return services[0] || null;
  }

  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM services WHERE 1=1';
    const params = [];

    if (filters.active !== undefined) {
      sql += ' AND active = ?';
      params.push(filters.active);
    }

    if (filters.search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ' ORDER BY name';

    return query(sql, params);
  }

  static async update(id, serviceData) {
    const updates = [];
    const params = [];

    const fields = ['name', 'description', 'price', 'duration', 'active'];
    
    for (const field of fields) {
      if (serviceData[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(serviceData[field]);
      }
    }

    if (updates.length === 0) return false;

    params.push(id);
    const result = await query(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`, params);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const result = await query('DELETE FROM services WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async toggleActive(id) {
    const result = await query('UPDATE services SET active = NOT active WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Service;
