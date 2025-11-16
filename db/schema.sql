-- Database schema per gestionale ordini

-- Tabella clienti
CREATE TABLE IF NOT EXISTS clienti (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    cognome VARCHAR(255) NOT NULL,
    cellulare VARCHAR(20) NOT NULL,
    indirizzo TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella prodotti
CREATE TABLE IF NOT EXISTS prodotti (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descrizione TEXT,
    prezzo DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100), -- Saponi Naturali, Creme Corpo, Mini-mo, Baffetti, Deodorante, Portasapone, Accessori, Kit
    variante VARCHAR(100), -- Per saponi, mini-mo, baffetti, portasapone
    formato VARCHAR(50), -- Per creme corpo (90ml, 180ml)
    e_kit BOOLEAN DEFAULT false, -- Se è un kit configurabile
    immagine_url VARCHAR(500), -- URL immagine prodotto
    disponibile BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella ordini
CREATE TABLE IF NOT EXISTS ordini (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clienti(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL, -- Mantenuto per retrocompatibilità
    nome VARCHAR(255) NOT NULL, -- Mantenuto per retrocompatibilità
    cognome VARCHAR(255) NOT NULL, -- Mantenuto per retrocompatibilità
    cellulare VARCHAR(20) NOT NULL, -- Mantenuto per retrocompatibilità
    data_consegna DATE NOT NULL,
    luogo_consegna TEXT NOT NULL,
    totale DECIMAL(10, 2) NOT NULL,
    note_richieste TEXT, -- Richieste specifiche su come comporre box/sacchetti
    stato VARCHAR(50) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella ordini_prodotti (relazione molti-a-molti)
CREATE TABLE IF NOT EXISTS ordini_prodotti (
    id SERIAL PRIMARY KEY,
    ordine_id INTEGER NOT NULL REFERENCES ordini(id) ON DELETE CASCADE,
    prodotto_id INTEGER NOT NULL REFERENCES prodotti(id) ON DELETE CASCADE,
    quantita INTEGER NOT NULL DEFAULT 1,
    prezzo_unitario DECIMAL(10, 2) NOT NULL,
    note_configurazione TEXT, -- Per salvare configurazione kit (es: "Mini-mo: Lavanda, Crema: Lilla 90ml")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_clienti_email ON clienti(email);
CREATE INDEX IF NOT EXISTS idx_ordini_cliente ON ordini(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordini_email ON ordini(email);
CREATE INDEX IF NOT EXISTS idx_ordini_data_consegna ON ordini(data_consegna);
CREATE INDEX IF NOT EXISTS idx_ordini_stato ON ordini(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_prodotti_ordine ON ordini_prodotti(ordine_id);
CREATE INDEX IF NOT EXISTS idx_ordini_prodotti_prodotto ON ordini_prodotti(prodotto_id);

-- Inserimento SAPONI NATURALI
INSERT INTO prodotti (nome, descrizione, prezzo, categoria, variante, immagine_url, disponibile) VALUES
('Sapone Calimero', 'Purificante al carbone vegetale', 4.50, 'Saponi Naturali', 'Calimero', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', true),
('Sapone Meramè', 'Neutro', 4.50, 'Saponi Naturali', 'Meramè', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', true),
('Sapone Pimpa', 'Purificante all''argilla rosa', 4.50, 'Saponi Naturali', 'Pimpa', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', true),
('Sapone Pepita', 'Delicato alla calendula', 4.50, 'Saponi Naturali', 'Pepita', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', true),
('Sapone Roka e Moka', 'Scrub al caffè', 4.50, 'Saponi Naturali', 'Roka e Moka', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', true),
('Sapone Terra', 'Purificante all''argilla verde ventilata', 4.50, 'Saponi Naturali', 'Terra', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

-- Inserimento CREME CORPO (90ml)
INSERT INTO prodotti (nome, descrizione, prezzo, categoria, variante, formato, immagine_url, disponibile) VALUES
('Crema Corpo Lilla 90ml', 'Rilassante con aloe vera e cera d''api, all''olio essenziale di Lavanda e Arancio dolce', 8.00, 'Creme Corpo', 'Lilla', '90ml', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', true),
('Crema Corpo Limone 90ml', 'Energizzante con aloe vera e cera d''api, all''olio essenziale di Limone e Petit grain', 8.00, 'Creme Corpo', 'Limone', '90ml', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', true),
('Crema Corpo Tangerine 90ml', 'Energizzante edizione limitata con aloe vera e cera d''api, all''olio essenziale di Arancio dolce ed essenza ai Fiori d''arancio', 8.00, 'Creme Corpo', 'Tangerine', '90ml', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

-- Inserimento CREME CORPO (180ml)
INSERT INTO prodotti (nome, descrizione, prezzo, categoria, variante, formato, immagine_url, disponibile) VALUES
('Crema Corpo Lilla 180ml', 'Rilassante con aloe vera e cera d''api, all''olio essenziale di Lavanda e Arancio dolce', 15.00, 'Creme Corpo', 'Lilla', '180ml', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', true),
('Crema Corpo Limone 180ml', 'Energizzante con aloe vera e cera d''api, all''olio essenziale di Limone e Petit grain', 15.00, 'Creme Corpo', 'Limone', '180ml', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', true),
('Crema Corpo Tangerine 180ml', 'Energizzante edizione limitata con aloe vera e cera d''api, all''olio essenziale di Arancio dolce ed essenza ai Fiori d''arancio', 15.00, 'Creme Corpo', 'Tangerine', '180ml', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

-- Inserimento MINI-MO
INSERT INTO prodotti (nome, descrizione, prezzo, categoria, variante, immagine_url, disponibile) VALUES
('Mini-mo Lavanda', 'Con cera d''api e burro di cacao, all''olio essenziale di Lavanda', 5.00, 'Mini-mo', 'Lavanda', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop', true),
('Mini-mo Menta', 'Con cera d''api e burro di cacao, all''olio essenziale di Menta', 5.00, 'Mini-mo', 'Menta', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

-- Inserimento BAFFETTI
INSERT INTO prodotti (nome, descrizione, prezzo, categoria, variante, immagine_url, disponibile) VALUES
('Baffetti Lavanda', 'Versione grande del Mini-mo pensata per essere utilizzata anche come dopobarba. Con cera d''api e burro di cacao, all''olio essenziale di Lavanda', 18.00, 'Baffetti', 'Lavanda', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop', true),
('Baffetti Menta', 'Versione grande del Mini-mo pensata per essere utilizzata anche come dopobarba. Con cera d''api e burro di cacao, all''olio essenziale di Menta', 18.00, 'Baffetti', 'Menta', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

-- Inserimento DEODORANTE
INSERT INTO prodotti (nome, descrizione, prezzo, categoria, immagine_url, disponibile) VALUES
('Deodorante solido in crema', 'Con cera di carnauba e olio di cocco, all''olio essenziale di Tea Tree, Bergamotto e Bois de Hò', 5.00, 'Deodorante', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

-- Inserimento PORTASAPONE
INSERT INTO prodotti (nome, descrizione, prezzo, categoria, variante, immagine_url, disponibile) VALUES
('Portasapone Tondo', 'Portasapone artigianale in ceramica', 14.00, 'Portasapone', 'Tondo', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop', true),
('Portasapone Mattonella', 'Portasapone artigianale in ceramica', 14.00, 'Portasapone', 'Mattonella', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

-- Inserimento ACCESSORI
INSERT INTO prodotti (nome, descrizione, prezzo, categoria, immagine_url, disponibile) VALUES
('Sacchetto Semplice', 'Riempi il tuo sacchettino con ciò che preferisci', 1.00, 'Accessori', 'https://images.unsplash.com/photo-1591047134859-ff0c0b10b4b1?w=400&h=400&fit=crop', true),
('Sacchetto in Fibra Vegetale', 'Riempi il tuo sacchettino con ciò che preferisci', 2.00, 'Accessori', 'https://images.unsplash.com/photo-1591047134859-ff0c0b10b4b1?w=400&h=400&fit=crop', true),
('Spugna di Luffa', 'Spugna naturale di luffa', 0.00, 'Accessori', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

-- Inserimento KIT (come prodotti speciali configurabili)
INSERT INTO prodotti (nome, descrizione, prezzo, categoria, e_kit, immagine_url, disponibile) VALUES
('KIT MINI', '1 Deodorante + 1 Mini-mo', 12.00, 'Kit', true, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop', true),
('KIT IDRATAZIONE v1', '1 Mini-mo + 1 Crema Corpo', 15.00, 'Kit', true, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop', true),
('KIT IDRATAZIONE v2', '1 Deodorante + 1 Crema Corpo', 15.00, 'Kit', true, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop', true),
('KIT IDRATAZIONE v3', '1 Deodorante + 1 Baffetti (pensata per lui)', 25.00, 'Kit', true, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop', true),
('KIT PORTASAPONE', 'Portasapone a scelta + 1 sapone solido', 20.00, 'Kit', true, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop', true),
('KIT ESSENZIALI', '1 Sapone solido + 1 Mini-mo + 1 Deodorante + 1 Crema corpo', 25.00, 'Kit', true, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop', true),
('KIT COCCOLATI', '1 Sapone solido + 1 Spugna di luffa + 1 Crema corpo + 1 Mini-mo + 1 Deodorante + 1 Portasapone a scelta', 42.00, 'Kit', true, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop', true)
ON CONFLICT DO NOTHING;

