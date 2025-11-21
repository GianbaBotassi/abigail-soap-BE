const cron = require('node-cron');
const { MailService } = require('./mailService.js');
const pool = require('./db/database.js'); // CommonJS

const mailService = new MailService();

// Cron job giornaliero alle 08:00 (Roma)
cron.schedule("0 8 * * *", async () => {
  try {
    const ordini = await getOrdiniInScadenza();
    await mailService.sendDailyOrderReport(process.env.MAIL_USER, ordini);
    console.log("Resoconto ordini inviato");
  } catch (err) {
    console.error("Errore cron job:", err);
  }
}, {
  timezone: "Europe/Rome"
});

// Recupera ordini in scadenza (oggi + 5 giorni)
async function getOrdiniInScadenza() {
  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        c.id AS cliente_id_db,
        c.email AS cliente_email,
        c.nome AS cliente_nome,
        c.cognome AS cliente_cognome,
        c.cellulare AS cliente_cellulare,
        json_agg(
          json_build_object(
            'id', op.id,
            'prodotto_id', op.prodotto_id,
            'nome', p.nome,
            'quantita', op.quantita,
            'prezzo_unitario', op.prezzo_unitario,
            'note_configurazione', op.note_configurazione
          )
        ) AS prodotti
      FROM ordini o
      LEFT JOIN clienti c ON o.cliente_id = c.id
      LEFT JOIN ordini_prodotti op ON o.id = op.ordine_id
      LEFT JOIN prodotti p ON op.prodotto_id = p.id
      WHERE o.data_consegna BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '5 days'
      GROUP BY o.id, c.id
      ORDER BY o.data_consegna ASC
    `);

    return result.rows;
  } catch (error) {
    console.error('Errore nel recupero degli ordini in scadenza:', error);
    return [];
  }
}
