const mysql = require('mysql2/promise');

const migrations = [
  {
    name: 'create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'dentista', 'recepcionista') NOT NULL DEFAULT 'recepcionista',
        phone VARCHAR(20),
        specialty VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_role (role),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_patients_table',
    sql: `
      CREATE TABLE IF NOT EXISTS patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dni VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20) NOT NULL,
        address VARCHAR(255),
        date_of_birth DATE,
        gender ENUM('M', 'F', 'Otro'),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dni (dni),
        INDEX idx_name (name),
        INDEX idx_last_name (last_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_services_table',
    sql: `
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) DEFAULT 0.00,
        duration INT DEFAULT 30,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active (active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_schedules_table',
    sql: `
      CREATE TABLE IF NOT EXISTS schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        day_of_week TINYINT NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        break_start TIME,
        break_end TIME,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_day (user_id, day_of_week),
        UNIQUE KEY unique_user_day (user_id, day_of_week)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_appointments_table',
    sql: `
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        dentist_id INT NOT NULL,
        service_id INT NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration INT DEFAULT 30,
        type ENUM('nueva', 'seguimiento', 'urgencia') DEFAULT 'nueva',
        status ENUM('pendiente', 'confirmada', 'cancelada', 'completada', 'no_presento') DEFAULT 'pendiente',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (dentist_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        INDEX idx_dentist_date (dentist_id, date),
        INDEX idx_patient (patient_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'create_notifications_table',
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NOT NULL,
        type ENUM('email', 'sms') NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
        sent_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_appointment (appointment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  }
];

const seedData = [
  {
    name: 'seed_services',
    sql: `
      INSERT IGNORE INTO services (id, name, description, price, duration) VALUES
      (1, 'Limpieza Dental', 'Limpieza profunda y profilaxis dental', 50.00, 45),
      (2, 'Examen General', 'Revisión completa de salud bucal', 35.00, 30),
      (3, 'Ortodoncia', 'Evaluación y tratamiento de ortodoncia', 100.00, 60),
      (4, 'Blanqueamiento', 'Tratamiento de blanqueamiento dental', 200.00, 90),
      (5, 'Extracción Simple', 'Extracción de pieza dental simple', 80.00, 45),
      (6, 'Endodoncia', 'Tratamiento de conducto', 300.00, 120),
      (7, 'Implante Dental', 'Colocación de implante dental', 800.00, 180),
      (8, 'Resina/Fotopolimerizable', 'Restauración con resina compuesta', 60.00, 45);
    `
  },
  {
    name: 'seed_admin_user',
    sql: `
      INSERT IGNORE INTO users (id, email, password, name, role, phone, specialty) VALUES
      (1, 'admin@dentalclinic.com', '$2a$10$8K1p/a0dR1xqM8K3yZQz5eFHpM9QvN5xGqJdKmL8vR2sW3yB0uHmO', 'Administrador', 'admin', '1234567890', NULL);
    `
  },
  {
    name: 'add_reset_token_columns',
    sql: `
      ALTER TABLE users
      ADD COLUMN reset_token VARCHAR(255) NULL,
      ADD COLUMN reset_expires DATETIME NULL,
      ADD INDEX idx_reset_token (reset_token);
    `
  },
  {
    name: 'add_rut_to_users',
    sql: `
      ALTER TABLE users ADD COLUMN rut VARCHAR(20) NULL UNIQUE,
      ADD INDEX idx_rut (rut);
    `
  }
];

async function runMigrations() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'secret',
      database: process.env.DB_NAME || 'dental_clinic',
      multipleStatements: true
    });

    console.log('Connected to database');

    for (const migration of migrations) {
      console.log(`Running migration: ${migration.name}`);
      await connection.query(migration.sql);
      console.log(`✓ ${migration.name} completed`);
    }

    console.log('\nSeeding data...');
    for (const seed of seedData) {
      console.log(`Running seed: ${seed.name}`);
      await connection.query(seed.sql);
      console.log(`✓ ${seed.name} completed`);
    }

    console.log('\n✅ All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
  runMigrations();
}

module.exports = { runMigrations };
