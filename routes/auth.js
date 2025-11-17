const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticazione e gestione utenti
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login utente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Credenziali non valide
 *       400:
 *         description: Username e password obbligatori
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username e password sono obbligatori' });
    }

    // Recupera l'utente dal database
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Username o password non validi' });
    }

    const user = result.rows[0];

    // Confronta la password con bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Username o password non validi' });
    }

    // Genera il token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Aggiorna last_login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      username: user.username,
      token
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Errore del server durante il login' });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verifica validità del token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 username:
 *                   type: string
 *       401:
 *         description: Token non valido o mancante
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, message: 'Token non fornito' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({
        valid: true,
        username: decoded.username
      });
    } catch (error) {
      res.status(401).json({ valid: false, message: 'Token non valido o scaduto' });
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ valid: false, message: 'Errore del server' });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuovo utente (solo per admin)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utente creato con successo
 *       400:
 *         description: Dati mancanti
 *       409:
 *         description: Username già esistente
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username e password sono obbligatori' });
    }

    // Controlla se l'utente esiste già
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username già esistente' });
    }

    // Hash della password con bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserisci il nuovo utente
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, hashedPassword]
    );

    res.status(201).json({
      message: 'Utente creato con successo',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Errore del server durante la registrazione' });
  }
});

module.exports = router;