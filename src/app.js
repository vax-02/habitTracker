require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');

// Importar rutas (se agregarán después)
// const authRoutes = require('./routes/authRoutes');
// const habitRoutes = require('./routes/habitRoutes');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('src/public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Rutas (se agregarán después)
// app.use('/api/auth', authRoutes);
// app.use('/api/habits', habitRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Middleware de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Iniciar servidor
async function startServer() {
  try {
    await prisma.$connect();
    console.log('Conectado a MySQL');
    
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;