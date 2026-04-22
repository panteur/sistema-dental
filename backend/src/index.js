const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

process.env.TZ = 'America/Santiago';

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const patientRoutes = require('./routes/patient.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const serviceRoutes = require('./routes/service.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const publicRoutes = require('./routes/public.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { notFoundHandler } = require('./middleware/notFound.middleware');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.1.10:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/public', publicRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    const db = require('./config/database');
    await db.testConnection();
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
