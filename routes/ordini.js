const express = require('express');
const router = express.Router();
const pool = require('../db/database');
const { MailService } = require('../mailService.js');
const mailService = new MailService();

/**
 * @swagger
 * tags:
 *   name: Ordini
 *   description: Gestione degli ordini
 */

/**
 * @swagger
 * /api/ordini:
 *   get:
 *     summary: Ottieni tutti gli ordini
 *     tags: [Ordini]
 *     responses:
 *       200:
 *         description: Lista di tutti gli ordini con dettagli clienti e prodotti
 *       500:
 *         description: Errore nel recupero degli ordini
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        c.id as cliente_id_db,
        c.email as cliente_email,
        c.nome as cliente_nome,
        c.cognome as cliente_cognome,
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
      LEFT JOIN clienti c ON o.cliente_id = c.id
      LEFT JOIN ordini_prodotti op ON o.id = op.ordine_id
      LEFT JOIN prodotti p ON op.prodotto_id = p.id
      GROUP BY o.id, c.id
      ORDER BY o.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ordini:', error);
    res.status(500).json({ error: 'Errore nel recupero degli ordini' });
  }
});

/**
 * @swagger
 * /api/ordini/{id}:
 *   get:
 *     summary: Ottieni un ordine per ID
 *     tags: [Ordini]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'ordine
 *     responses:
 *       200:
 *         description: Dettaglio dell'ordine con prodotti e cliente
 *       404:
 *         description: Ordine non trovato
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const ordineResult = await pool.query('SELECT * FROM ordini WHERE id = $1', [id]);
    
    if (ordineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    const prodottiResult = await pool.query(`
      SELECT 
        op.*,
        p.nome,
        p.descrizione,
        op.note_configurazione
      FROM ordini_prodotti op
      JOIN prodotti p ON op.prodotto_id = p.id
      WHERE op.ordine_id = $1
    `, [id]);
    
    const ordine = ordineResult.rows[0];
    
    if (ordine.cliente_id) {
      const clienteResult = await pool.query('SELECT * FROM clienti WHERE id = $1', [ordine.cliente_id]);
      ordine.cliente = clienteResult.rows.length > 0 ? clienteResult.rows[0] : null;
    } else {
      ordine.cliente = null;
    }
    
    ordine.prodotti = prodottiResult.rows;
    
    res.json(ordine);
  } catch (error) {
    console.error('Error fetching ordine:', error);
    res.status(500).json({ error: 'Errore nel recupero dell\'ordine' });
  }
});

/**
 * @swagger
 * /api/ordini:
 *   post:
 *     summary: Crea un nuovo ordine
 *     tags: [Ordini]
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
 *               - data_consegna
 *               - luogo_consegna
 *               - prodotti
 *             properties:
 *               email:
 *                 type: string
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *               cellulare:
 *                 type: string
 *               data_consegna:
 *                 type: string
 *                 format: date
 *               luogo_consegna:
 *                 type: string
 *               prodotti:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     prodotto_id:
 *                       type: integer
 *                     quantita:
 *                       type: integer
 *                     note_configurazione:
 *                       type: string
 *               cliente_id:
 *                 type: integer
 *               note_richieste:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ordine creato con successo
 *       400:
 *         description: Dati mancanti o non validi
 *       500:
 *         description: Errore nella creazione dell'ordine
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { email, nome, cognome, cellulare, data_consegna, luogo_consegna, prodotti, cliente_id, note_richieste } = req.body;

    if (!email || !nome || !cognome || !cellulare || !data_consegna || !luogo_consegna) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }

    if (!prodotti || !Array.isArray(prodotti) || prodotti.length === 0) {
      return res.status(400).json({ error: 'Devi selezionare almeno un prodotto' });
    }

    // Recupero o creo cliente
    let clienteId = cliente_id;
    if (!clienteId) {
      const clienteExistente = await client.query('SELECT id FROM clienti WHERE email = $1', [email]);
      if (clienteExistente.rows.length > 0) {
        clienteId = clienteExistente.rows[0].id;
      } else {
        const nuovoCliente = await client.query(
          `INSERT INTO clienti (email, nome, cognome, cellulare, indirizzo)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [email, nome, cognome, cellulare, luogo_consegna]
        );
        clienteId = nuovoCliente.rows[0].id;
      }
    }

    // Calcolo totale ordine
    let totale = 0;
    for (const item of prodotti) {
      const prodottoResult = await client.query(
        'SELECT prezzo, disponibile FROM prodotti WHERE id = $1',
        [item.prodotto_id]
      );
      if (prodottoResult.rows.length === 0) {
        throw new Error(`Prodotto con ID ${item.prodotto_id} non trovato`);
      }
      if (!prodottoResult.rows[0].disponibile) {
        throw new Error(`Prodotto con ID ${item.prodotto_id} non disponibile`);
      }

      const quantita = parseInt(item.quantita) || 1;

      // Usa prezzo_totale dal FE se prodotto configurabile, altrimenti prezzo DB
      const prezzoItem = item.note_configurazione
        ? parseFloat(item.prezzo_totale || 0)
        : parseFloat(prodottoResult.rows[0].prezzo) * quantita;

      totale += prezzoItem;
    }

    // Inserimento ordine
    const ordineResult = await client.query(
      `INSERT INTO ordini (cliente_id, email, nome, cognome, cellulare, data_consegna, luogo_consegna, totale, note_richieste)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [clienteId, email, nome, cognome, cellulare, data_consegna, luogo_consegna, totale, note_richieste || null]
    );
    const ordine = ordineResult.rows[0];

    // Inserimento prodotti nell'ordine
    for (const item of prodotti) {
      const prodottoResult = await client.query('SELECT prezzo FROM prodotti WHERE id = $1', [item.prodotto_id]);
      const quantita = parseInt(item.quantita) || 1;

      // Prezzo unitario = prezzo_totale / quantita se configurabile
      const prezzoUnitario = item.note_configurazione
        ? parseFloat(item.prezzo_totale || 0) / quantita
        : parseFloat(prodottoResult.rows[0].prezzo);

      await client.query(
        `INSERT INTO ordini_prodotti (ordine_id, prodotto_id, quantita, prezzo_unitario, note_configurazione)
         VALUES ($1, $2, $3, $4, $5)`,
        [ordine.id, item.prodotto_id, quantita, prezzoUnitario, item.note_configurazione || null]
      );
    }

    await client.query('COMMIT');

    // Recupero ordine completo con prodotti
    const ordineCompletoResult = await pool.query(`
      SELECT 
        o.*,
        json_build_object(
          'id', c.id,
          'nome', c.nome,
          'cognome', c.cognome,
          'email', c.email,
          'cellulare', c.cellulare
        ) AS cliente,
        COALESCE(json_agg(
          json_build_object(
            'id', op.id,
            'prodotto_id', op.prodotto_id,
            'nome', p.nome,
            'quantita', op.quantita,
            'prezzo_unitario', op.prezzo_unitario,
            'note_configurazione', op.note_configurazione
          )
        ) FILTER (WHERE op.id IS NOT NULL), '[]') AS prodotti
      FROM ordini o
      LEFT JOIN clienti c ON o.cliente_id = c.id
      LEFT JOIN ordini_prodotti op ON o.id = op.ordine_id
      LEFT JOIN prodotti p ON op.prodotto_id = p.id
      WHERE o.id = $1
      GROUP BY o.id, c.id
    `, [ordine.id]);

    const ordineCompleto = ordineCompletoResult.rows[0];

    // Invia email al cliente
    await mailService.sendOrderToCustomer(ordineCompleto);

    // Invia email allo staff
    await mailService.sendOrderToStaff(ordineCompleto);

    res.status(201).json(ordineCompleto);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating ordine:', error);
    res.status(500).json({ error: error.message || 'Errore nella creazione dell\'ordine' });
  } finally {
    client.release();
  }
});


/**
 * @swagger
 * /api/ordini/{id}/stato:
 *   put:
 *     summary: Aggiorna lo stato di un ordine
 *     tags: [Ordini]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'ordine
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stato:
 *                 type: string
 *                 enum: [pendente, in_lavorazione, spedito, consegnato, annullato]
 *     responses:
 *       200:
 *         description: Stato dell'ordine aggiornato
 *       400:
 *         description: Stato non valido
 *       404:
 *         description: Ordine non trovato
 */
router.put('/:id/stato', async (req, res) => {
  try {
    const { id } = req.params;
    const { stato } = req.body;
    
    const statiValidi = ['pendente', 'in_lavorazione', 'spedito', 'consegnato', 'annullato'];
    if (!statiValidi.includes(stato)) {
      return res.status(400).json({ error: 'Stato non valido' });
    }
    
    const result = await pool.query(
      'UPDATE ordini SET stato = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [stato, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating ordine stato:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato' });
  }
});

module.exports = router;
