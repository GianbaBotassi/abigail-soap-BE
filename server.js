const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const setupSwagger = require('./swagger');

// middleware, cors ecc.

const allowedOrigin = 'http://localhost:4200';

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: allowedOrigin,          // frontend Angular
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH','HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,              // permette cookie/autenticazione se servono
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.options('*', cors(corsOptions));

// Import routes
const prodottiRoutes = require('./routes/prodotti');
const ordiniRoutes = require('./routes/ordini');
const clientiRoutes = require('./routes/clienti');

// Routes
app.use('/api/prodotti', prodottiRoutes);
app.use('/api/ordini', ordiniRoutes);
app.use('/api/clienti', clientiRoutes);



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

setupSwagger(app);
