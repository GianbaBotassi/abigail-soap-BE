const { Pool } = require('pg');
require('dotenv').config();

let poolConfig;

// Se esiste DATABASE_URL (Supabase)
if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }   // OBBLIGATORIO con Supabase pooler
  };
} else {
  // Connessione locale
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gestionale_ordini',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: { rejectUnauthorized: false }
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connessione
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Errore connessione database:', err);
  } else {
    console.log('✓ Connesso al database PostgreSQL');
  }
});

module.exports = pool;
