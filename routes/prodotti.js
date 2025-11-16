const express = require('express');
const router = express.Router();
const pool = require('../db/database');

/**
 * @swagger
 * tags:
 *   name: Prodotti
 *   description: Gestione dei prodotti
 */

/**
 * @swagger
 * /api/prodotti:
 *   get:
 *     summary: Ottieni tutti i prodotti
 *     tags: [Prodotti]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtra per categoria
 *       - in: query
 *         name: escludi_kit
 *         schema:
 *           type: boolean
 *         description: Escludi prodotti che sono kit
 *     responses:
 *       200:
 *         description: Lista dei prodotti
 */
router.get('/', async (req, res) => {
  try {
    const { categoria, escludi_kit } = req.query;
    let query = 'SELECT * FROM prodotti WHERE disponibile = true';
    const params = [];
    
    if (categoria) {
      query += ' AND categoria = $1';
      params.push(categoria);
    }
    
    if (escludi_kit === 'true') {
      query += ' AND (e_kit = false OR e_kit IS NULL)';
    }
    
    query += ' ORDER BY categoria, nome';
    
    const result = await pool.query(query, params.length > 0 ? params : null);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prodotti:', error);
    res.status(500).json({ error: 'Errore nel recupero dei prodotti' });
  }
});

/**
 * @swagger
 * /api/prodotti/categorie:
 *   get:
 *     summary: Ottieni tutte le categorie disponibili
 *     tags: [Prodotti]
 *     responses:
 *       200:
 *         description: Lista delle categorie
 */
router.get('/categorie', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT categoria FROM prodotti WHERE disponibile = true AND categoria IS NOT NULL ORDER BY categoria'
    );
    res.json(result.rows.map(row => row.categoria));
  } catch (error) {
    console.error('Error fetching categorie:', error);
    res.status(500).json({ error: 'Errore nel recupero delle categorie' });
  }
});

/**
 * @swagger
 * /api/prodotti/{id}:
 *   get:
 *     summary: Ottieni un prodotto per ID
 *     tags: [Prodotti]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto
 *     responses:
 *       200:
 *         description: Dettaglio del prodotto
 *       404:
 *         description: Prodotto non trovato
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM prodotti WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching prodotto:', error);
    res.status(500).json({ error: 'Errore nel recupero del prodotto' });
  }
});

/**
 * @swagger
 * /api/prodotti:
 *   post:
 *     summary: Crea un nuovo prodotto
 *     tags: [Prodotti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - prezzo
 *             properties:
 *               nome:
 *                 type: string
 *               descrizione:
 *                 type: string
 *               prezzo:
 *                 type: number
 *               disponibile:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Prodotto creato
 *       400:
 *         description: Dati mancanti o non validi
 */
router.post('/', async (req, res) => {
  try {
    const { nome, descrizione, prezzo, disponibile } = req.body;
    
    if (!nome || !prezzo) {
      return res.status(400).json({ error: 'Nome e prezzo sono obbligatori' });
    }
    
    const result = await pool.query(
      'INSERT INTO prodotti (nome, descrizione, prezzo, disponibile) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, descrizione || null, prezzo, disponibile !== undefined ? disponibile : true]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating prodotto:', error);
    res.status(500).json({ error: 'Errore nella creazione del prodotto' });
  }
});

/**
 * @swagger
 * /api/prodotti/{id}:
 *   put:
 *     summary: Aggiorna un prodotto esistente
 *     tags: [Prodotti]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descrizione:
 *                 type: string
 *               prezzo:
 *                 type: number
 *               disponibile:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Prodotto aggiornato
 *       404:
 *         description: Prodotto non trovato
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descrizione, prezzo, disponibile } = req.body;
    
    const result = await pool.query(
      'UPDATE prodotti SET nome = $1, descrizione = $2, prezzo = $3, disponibile = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [nome, descrizione, prezzo, disponibile, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating prodotto:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del prodotto' });
  }
});

/**
 * @swagger
 * /api/prodotti/{id}:
 *   delete:
 *     summary: Elimina un prodotto
 *     tags: [Prodotti]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto da eliminare
 *     responses:
 *       200:
 *         description: Prodotto eliminato con successo
 *       404:
 *         description: Prodotto non trovato
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM prodotti WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }
    
    res.json({ message: 'Prodotto eliminato con successo' });
  } catch (error) {
    console.error('Error deleting prodotto:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione del prodotto' });
  }
});

module.exports = router;
