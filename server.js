const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const setupSwagger = require('./swagger');

// Creiamo l'app
const app = express();
const PORT = process.env.PORT || 3000;

// CORS dinamico
const allowedOrigins = [
  process.env.FRONTEND_URL,    // Angular frontend
  process.env.BACKEND_URL       // Swagger UI o altre richieste dallo stesso server
];

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS non autorizzato'));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH','HEAD'],
  allowedHeaders: ['Content-Type','Authorization'],
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

app.use('/api/prodotti', prodottiRoutes);
app.use('/api/ordini', ordiniRoutes);
app.use('/api/clienti', clientiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Swagger
setupSwagger(app);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
