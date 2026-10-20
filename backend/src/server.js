const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const officeRoutes = require('./routes/officeRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded photos & documents
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'HadirKu Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/office', officeRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 HadirKu Backend API running on port ${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   Static Uploads: http://localhost:${PORT}/uploads`);
  console.log(`===============================================`);
});

module.exports = app;
