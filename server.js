const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config({ path: '.env.development' });
const setupSwagger = require('./swagger');
const { authenticateToken } = require('./middleware/auth');

// Creiamo l'app
const app = express();
const PORT = process.env.PORT || 3000;

// CORS dinamico
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
    'http://localhost:4200',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4200',
    'http://192.168.56.1:4200'
  ];

const corsOptions = {
  origin: function (origin, callback) {
    // Permetti richieste senza origin (come Postman, curl, o stesso server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked for origin: ${origin}`);
      console.log(`✅ Allowed origins:`, allowedOrigins);
      callback(new Error('CORS non autorizzato'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const prodottiRoutes = require('./routes/prodotti');
const ordiniRoutes = require('./routes/ordini');
const clientiRoutes = require('./routes/clienti');
const authRoutes = require('./routes/auth');

app.use('/api/prodotti', prodottiRoutes);
app.use('/api/ordini', ordiniRoutes);
app.use('/api/clienti', clientiRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Swagger
setupSwagger(app);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS origins:`, allowedOrigins);
});
