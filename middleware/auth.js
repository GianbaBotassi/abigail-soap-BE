const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

/**
 * Middleware per verificare il token JWT
 * Aggiunge l'utente decodificato a req.user se il token è valido
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token di autenticazione non fornito' });
  }

  const token = authHeader.substring(7); // Rimuove "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Aggiunge i dati dell'utente alla request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token scaduto' });
    }
    return res.status(403).json({ message: 'Token non valido' });
  }
};

/**
 * Middleware opzionale - verifica il token se presente, ma non blocca la richiesta
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token non valido, ma non blocchiamo la richiesta
      req.user = null;
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};