import nodemailer from "nodemailer";
import { formatDate } from "./utils.js";  // Assicurati che utils.js esporti la funzione con `export function formatDate...`


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export class MailService {
  constructor() {
    this.transporter = transporter;
  }

  async sendMail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Lab di Abigail" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log("Email inviata:", info.messageId);
      return true;
    } catch (error) {
      console.error("Errore durante l'invio dell'email:", error);
      return false;
    }
  }

  async sendOrderToCustomer(ordine) {
    const renderProdotti = this.renderProdottiHtml(ordine.prodotti);

    const html = `
      <h2>Ciao ${ordine.cliente.nome}, grazie per il tuo ordine!</h2>
      <p>Siamo felici che tu abbia scelto di supportare la nostra attività. 🎁</p>

      <p>Il tuo ordine è stato confermato con successo!</p>

      <h3>Dettagli consegna richiesta</h3>
      <p><b>Data:</b> ${formatDate(ordine.data_consegna)}</p>
      <p><b>Luogo:</b> ${ordine.luogo_consegna}</p>

      <p><b>Totale:</b> €${parseFloat(ordine.totale).toFixed(2)}</p>

      <h3>Prodotti ordinati:</h3>
      <ul>
        ${renderProdotti}
      </ul>

      ${ordine.note_richieste ? `<p><b>Richieste speciali:</b> ${ordine.note_richieste}</p>` : ""}

      <p>Ti contatteremo appena il tuo ordine sarà pronto per la consegna.</p>
      <p>Grazie ancora per averci scelto! 🎄✨</p>
      <p>Ti auguriamo un Buon Natale e delle feste serene!</p>
    `;

    return this.sendMail(ordine.cliente.email, "Conferma del tuo ordine", html);
  }

  async sendOrderToStaff(ordine) {
    const renderProdotti = this.renderProdottiHtmlStaff(ordine.prodotti);

    const html = `
      <h2>Nuovo ordine ricevuto</h2>
      <p><b>ID Ordine:</b> #${ordine.id}</p>

      <h3>Cliente</h3>
      <p>${ordine.cliente.nome} ${ordine.cliente.cognome}</p>
      <p>Email: ${ordine.cliente.email}</p>
      <p>Telefono: ${ordine.cliente.cellulare}</p>

      <h3>Consegna</h3>
      <p><b>Data:</b> ${formatDate(ordine.data_consegna)}</p>
      <p><b>Luogo:</b> ${ordine.luogo_consegna}</p>

      <h3>Totale</h3>
      <p><b>€${parseFloat(ordine.totale).toFixed(2)}</b></p>

      <h3>Prodotti</h3>
      <ul>
        ${renderProdotti}
      </ul>

      ${ordine.note_richieste ? `<p><b>Richieste Cliente:</b> ${ordine.note_richieste}</p>` : ""}
    `;

    return this.sendMail(process.env.MAIL_USER, "Nuovo ordine ricevuto", html);
  }

  async sendDailyOrderReport(ordini) {
    const oggi = new Date();
    const cinqueGiorniDopo = new Date();
    cinqueGiorniDopo.setDate(oggi.getDate() + 5);

    const ordiniInScadenza = ordini.filter(ordine => {
      const dataConsegna = new Date(ordine.data_consegna);
      return dataConsegna >= oggi && dataConsegna <= cinqueGiorniDopo;
    });

    if (ordiniInScadenza.length === 0) {
      const htmlVuoto = `
        <h2>Resoconto ordini in scadenza</h2>
        <p>Nessun ordine in scadenza nei prossimi 5 giorni.</p>
      `;
      return this.sendMail(process.env.MAIL_USER, "Resoconto ordini in scadenza", htmlVuoto);
    }

    const righeTabella = ordiniInScadenza.map(o => {

      return `
        <tr>
          <td>${o.data_consegna}</td>
          <td>${o.luogo_consegna}</td>
          <td>${o.cliente.nome} ${o.cliente.cognome}</td>
          <td>${o.cliente.email}</td>
          <td>${o.cliente.cellulare}</td>
          <td>€${parseFloat(o.totale).toFixed(2)}</td>
          <td>${o.note_richieste || ""}</td>
        </tr>
      `;
    }).join("");

    const html = `
      <h2>Resoconto ordini in scadenza</h2>
      <p>Ordini con consegna dal <b>${oggi.toLocaleDateString()}</b> ai prossimi 5 giorni:</p>

      <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #667eea; color: white;">
            <th style="padding: 8px; border: 1px solid #ddd;">Data consegna</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Luogo consegna</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Cliente</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Email</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Cellulare</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Totale</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Note & Prodotti</th>
          </tr>
        </thead>
        <tbody>
          ${righeTabella}
        </tbody>
      </table>

      <p>Questo è un resoconto automatico generato dal sistema.</p>
    `;

    return this.sendMail(process.env.MAIL_USER, "Resoconto ordini in scadenza", html);
  }

  // Helper methods
  renderProdottiHtml(prodotti) {
    if (!prodotti || prodotti.length === 0) return "<p>Nessun prodotto.</p>";
  
    const righe = prodotti.map(p => {
      let noteHtml = "";
      if (p.note_configurazione) {
        try {
          const noteObj = JSON.parse(p.note_configurazione);
          noteHtml = `<ul style="margin:0; padding-left: 15px;">${Object.values(noteObj)
            .map(n => `<li>${n}</li>`).join("")}</ul>`;
        } catch (err) {
          console.error("Errore parsing note configurazione:", err);
        }
      }
  
      return `
        <tr>
          <td style="padding:8px; border:1px solid #ddd;">${p.nome}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:center;">${p.quantita}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">€${p.prezzo_unitario.toFixed(2)}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:right;">€${(p.prezzo_unitario * p.quantita).toFixed(2)}</td>
          <td style="padding:8px; border:1px solid #ddd;">${noteHtml}</td>
        </tr>
      `;
    }).join("");
  
    return `
      <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif; margin-top:10px;">
        <thead>
          <tr style="background-color:#667eea; color:white;">
            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Prodotto</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:center;">Quantità</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:right;">Prezzo Unitario</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:right;">Totale</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Note</th>
          </tr>
        </thead>
        <tbody>
          ${righe}
        </tbody>
      </table>
    `;
  }

  renderProdottiHtmlStaff(prodotti) {
    if (!prodotti || prodotti.length === 0) return "<p>Nessun prodotto.</p>";
  
    const righe = prodotti.map(p => {
      let noteHtml = "";
      if (p.note_configurazione) {
        try {
          const noteObj = JSON.parse(p.note_configurazione);
          noteHtml = `<ul style="margin:0; padding-left: 15px;">${Object.values(noteObj)
            .map(n => `<li>${n}</li>`).join("")}</ul>`;
        } catch (err) {
          console.error("Errore parsing note configurazione:", err);
        }
      }
  
      return `
        <tr>
          <td style="padding:8px; border:1px solid #ddd;">${p.nome}</td>
          <td style="padding:8px; border:1px solid #ddd; text-align:center;">${p.quantita}</td>
          <td style="padding:8px; border:1px solid #ddd;">${noteHtml}</td>
        </tr>
      `;
    }).join("");
  
    return `
      <table style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif; margin-top:10px;">
        <thead>
          <tr style="background-color:#667eea; color:white;">
            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Prodotto</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:center;">Quantità</th>
            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Note</th>
          </tr>
        </thead>
        <tbody>
          ${righe}
        </tbody>
      </table>
    `;
  }
  
  
}
