const express = require('express');
const router = express.Router();
const pool = require('../db/database');

/**
 * @swagger
 * tags:
 *   name: Clienti
 *   description: Gestione dei clienti
 */

/**
 * @swagger
 * /api/clienti:
 *   get:
 *     summary: Ottieni tutti i clienti
 *     tags: [Clienti]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Ricerca clienti per nome, cognome, email o cellulare
 *     responses:
 *       200:
 *         description: Lista dei clienti
 */
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM clienti';
    const params = [];
    
    if (search) {
      query += ' WHERE email ILIKE $1 OR nome ILIKE $1 OR cognome ILIKE $1 OR cellulare ILIKE $1';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY cognome, nome';
    
    const result = await pool.query(query, params.length > 0 ? params : null);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clienti:', error);
    res.status(500).json({ error: 'Errore nel recupero dei clienti' });
  }
});

/**
 * @swagger
 * /api/clienti/{id}:
 *   get:
 *     summary: Ottieni un cliente per ID
 *     tags: [Clienti]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Dettaglio del cliente
 *       404:
 *         description: Cliente non trovato
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM clienti WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching cliente:', error);
    res.status(500).json({ error: 'Errore nel recupero del cliente' });
  }
});

/**
 * @swagger
 * /api/clienti/email/{email}:
 *   get:
 *     summary: Ottieni un cliente per email
 *     tags: [Clienti]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email del cliente
 *     responses:
 *       200:
 *         description: Dettaglio del cliente
 *       404:
 *         description: Cliente non trovato
 */
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query('SELECT * FROM clienti WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching cliente by email:', error);
    res.status(500).json({ error: 'Errore nel recupero del cliente' });
  }
});

/**
 * @swagger
 * /api/clienti:
 *   post:
 *     summary: Crea un nuovo cliente
 *     tags: [Clienti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - nome
 *               - cognome
 *               - cellulare
 *             properties:
 *               email:
 *                 type: string
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *               cellulare:
 *                 type: string
 *               indirizzo:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creato
 *       400:
 *         description: Dati mancanti o non validi
 *       409:
 *         description: Cliente con email già esistente
 */
router.post('/', async (req, res) => {
  try {
    const { email, nome, cognome, cellulare, indirizzo, note } = req.body;
    
    if (!email || !nome || !cognome || !cellulare) {
      return res.status(400).json({ error: 'Email, nome, cognome e cellulare sono obbligatori' });
    }
    
    const existingCliente = await pool.query('SELECT id FROM clienti WHERE email = $1', [email]);
    if (existingCliente.rows.length > 0) {
      return res.status(409).json({ error: 'Un cliente con questa email esiste già', cliente: existingCliente.rows[0] });
    }
    
    const result = await pool.query(
      `INSERT INTO clienti (email, nome, cognome, cellulare, indirizzo, note)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, nome, cognome, cellulare, indirizzo || null, note || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating cliente:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Un cliente con questa email esiste già' });
    }
    res.status(500).json({ error: 'Errore nella creazione del cliente' });
  }
});

/**
 * @swagger
 * /api/clienti/{id}:
 *   put:
 *     summary: Aggiorna un cliente esistente
 *     tags: [Clienti]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *               cellulare:
 *                 type: string
 *               indirizzo:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente aggiornato
 *       404:
 *         description: Cliente non trovato
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nome, cognome, cellulare, indirizzo, note } = req.body;
    
    const result = await pool.query(
      `UPDATE clienti 
       SET email = $1, nome = $2, cognome = $3, cellulare = $4, indirizzo = $5, note = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [email, nome, cognome, cellulare, indirizzo || null, note || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente non trovato' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating cliente:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del cliente' });
  }
});

/**
 * @swagger
 * /api/clienti/{id}/ordini:
 *   get:
 *     summary: Ottieni tutti gli ordini di un cliente
 *     tags: [Clienti]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Lista degli ordini del cliente
 *       500:
 *         description: Errore nel recupero degli ordini
 */
router.get('/:id/ordini', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', op.id,
            'prodotto_id', op.prodotto_id,
            'nome', p.nome,
            'quantita', op.quantita,
            'prezzo_unitario', op.prezzo_unitario,
            'note_configurazione', op.note_configurazione
          )
        ) as prodotti
      FROM ordini o
      LEFT JOIN ordini_prodotti op ON o.id = op.ordine_id
      LEFT JOIN prodotti p ON op.prodotto_id = p.id
      WHERE o.cliente_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ordini cliente:', error);
    res.status(500).json({ error: 'Errore nel recupero degli ordini del cliente' });
  }
});

module.exports = router;
