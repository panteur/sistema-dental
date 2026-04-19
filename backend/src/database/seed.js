const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'secret',
      database: process.env.DB_NAME || 'dental_clinic'
    });

    console.log('Connected to database');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const dentistPassword = await bcrypt.hash('dentist123', 10);
    const receptionistPassword = await bcrypt.hash('receptionist123', 10);

    const users = [
      {
        email: 'admin@dentalclinic.com',
        password: adminPassword,
        name: 'Carlos Administrador',
        role: 'admin',
        phone: '555-0001'
      },
      {
        email: 'dr.garcia@dentalclinic.com',
        password: dentistPassword,
        name: 'Dr. Roberto García',
        role: 'dentista',
        phone: '555-0002',
        specialty: 'Ortodoncia'
      },
      {
        email: 'dra.martinez@dentalclinic.com',
        password: dentistPassword,
        name: 'Dra. Ana Martínez',
        role: 'dentista',
        phone: '555-0003',
        specialty: 'Endodoncia'
      },
      {
        email: 'recepcion@dentalclinic.com',
        password: receptionistPassword,
        name: 'María Recepción',
        role: 'recepcionista',
        phone: '555-0004'
      }
    ];

    console.log('\nSeeding users...');
    for (const user of users) {
      try {
        await connection.query(
          `INSERT INTO users (email, password, name, role, phone, specialty) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [user.email, user.password, user.name, user.role, user.phone, user.specialty || null]
        );
        console.log(`✓ User: ${user.email}`);
      } catch (error) {
        console.error(`✗ Error inserting ${user.email}:`, error.message);
      }
    }

    const patients = [
      { dni: '12345678A', name: 'Juan', last_name: 'Pérez López', phone: '600111222', email: 'juan.perez@email.com' },
      { dni: '23456789B', name: 'María', last_name: 'García Ruiz', phone: '600222333', email: 'maria.garcia@email.com' },
      { dni: '34567890C', name: 'Pedro', last_name: 'Sánchez Torres', phone: '600333444', email: 'pedro.sanchez@email.com' },
      { dni: '45678901D', name: 'Laura', last_name: 'Fernández Castro', phone: '600444555', email: 'laura.fernandez@email.com' }
    ];

    console.log('\nSeeding patients...');
    for (const patient of patients) {
      try {
        await connection.query(
          `INSERT INTO patients (dni, name, last_name, phone, email) VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [patient.dni, patient.name, patient.last_name, patient.phone, patient.email]
        );
        console.log(`✓ Patient: ${patient.name} ${patient.last_name}`);
      } catch (error) {
        console.error(`✗ Error inserting ${patient.name}:`, error.message);
      }
    }

    console.log('\nSeeding schedules for dentists...');
    const scheduleTimes = [
      { day: 1, start: '09:00', end: '17:00', breakStart: '12:00', breakEnd: '13:00' },
      { day: 2, start: '09:00', end: '17:00', breakStart: '12:00', breakEnd: '13:00' },
      { day: 3, start: '09:00', end: '17:00', breakStart: '12:00', breakEnd: '13:00' },
      { day: 4, start: '09:00', end: '17:00', breakStart: '12:00', breakEnd: '13:00' },
      { day: 5, start: '09:00', end: '14:00', breakStart: null, breakEnd: null }
    ];

    for (const schedule of scheduleTimes) {
      try {
        await connection.query(
          `INSERT INTO schedules (user_id, day_of_week, start_time, end_time, break_start, break_end)
           VALUES (2, ?, ?, ?, ?, ?)`,
          [schedule.day, schedule.start, schedule.end, schedule.breakStart, schedule.breakEnd]
        );
      } catch (error) {
        // Ignore duplicate day errors
      }
    }
    console.log('✓ Schedules created for Dr. García');

    console.log('\n✅ Seed completed successfully');
    console.log('\n📋 Test credentials:');
    console.log('   Admin: admin@dentalclinic.com / admin123');
    console.log('   Dentist: dr.garcia@dentalclinic.com / dentist123');
    console.log('   Receptionist: recepcion@dentalclinic.com / receptionist123');

  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
  seed();
}

module.exports = { seed };
