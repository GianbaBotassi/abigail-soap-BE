require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const setupSwagger = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Gestione CORS dinamica
const allowedOrigins = [
  'http://localhost:4200',        // sviluppo locale
  process.env.FRONTEND_URL        // produzione
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS non permesso'));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH','HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.options('*', cors(corsOptions));

// Routes
const prodottiRoutes = require('./routes/prodotti');
const ordiniRoutes = require('./routes/ordini');
const clientiRoutes = require('./routes/clienti');

app.use('/api/prodotti', prodottiRoutes);
app.use('/api/ordini', ordiniRoutes);
app.use('/api/clienti', clientiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}, env: ${process.env.NODE_ENV}`);
});

setupSwagger(app, process.env.BACKEND_URL || `http://localhost:${PORT}/api`);
