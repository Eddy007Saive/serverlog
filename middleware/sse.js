const userConnections = new Map();

// Fonction utilitaire pour envoyer des événements SSE
const createSSEResponse = (res, userId, req) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Pour nginx

  const sendEvent = (eventType, data) => {
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Stocker la connexion pour cet utilisateur
  if (userId) {
    if (!userConnections.has(userId)) {
      userConnections.set(userId, []);
    }
    
    const connection = { res, sendEvent, timestamp: Date.now() };
    userConnections.get(userId).push(connection);

    console.log(`✅ Connexion SSE ajoutée pour user ${userId}. Total: ${userConnections.get(userId).length}`);
  }

  // Nettoyer à la déconnexion du client
  if (req) {
    req.on('close', () => {
      if (userId && userConnections.has(userId)) {
        const connections = userConnections.get(userId);
        const index = connections.findIndex(conn => conn.res === res);
        
        if (index > -1) {
          connections.splice(index, 1);
          console.log(`🔌 Connexion SSE fermée pour user ${userId}. Restantes: ${connections.length}`);
        }
        
        // Supprimer l'entrée si plus aucune connexion
        if (connections.length === 0) {
          userConnections.delete(userId);
          console.log(`🗑️ Aucune connexion restante pour user ${userId}, suppression de l'entrée`);
        }
      }
    });
  }

  return { sendEvent };
};

// Fonction pour envoyer un événement à un utilisateur spécifique
const sendToUser = (userId, eventType, data) => {
  const connections = userConnections.get(userId);
  
  if (!connections || connections.length === 0) {
    console.warn(`⚠️ Aucune connexion SSE active pour user ${userId}`);
    return false;
  }

  console.log(`📤 Envoi événement "${eventType}" à ${connections.length} connexion(s) pour user ${userId}`);
  
  connections.forEach(({ sendEvent }, index) => {
    try {
      sendEvent(eventType, data);
    } catch (error) {
      console.error(`❌ Erreur envoi SSE à connexion ${index} pour user ${userId}:`, error.message);
    }
  });

  return true;
};

// Fonction pour obtenir le nombre de connexions actives
const getActiveConnections = (userId = null) => {
  if (userId) {
    const connections = userConnections.get(userId);
    return connections ? connections.length : 0;
  }
  
  let total = 0;
  userConnections.forEach(connections => {
    total += connections.length;
  });
  return total;
};

// Fonction pour nettoyer les connexions inactives (optionnel)
const cleanupStaleConnections = (maxAgeMs = 3600000) => { // 1 heure par défaut
  const now = Date.now();
  let cleaned = 0;

  userConnections.forEach((connections, userId) => {
    const validConnections = connections.filter(conn => {
      const isStale = (now - conn.timestamp) > maxAgeMs;
      if (isStale) cleaned++;
      return !isStale;
    });

    if (validConnections.length === 0) {
      userConnections.delete(userId);
    } else if (validConnections.length < connections.length) {
      userConnections.set(userId, validConnections);
    }
  });

  if (cleaned > 0) {
    console.log(`🧹 Nettoyage: ${cleaned} connexion(s) obsolète(s) supprimée(s)`);
  }

  return cleaned;
};

module.exports = {
  createSSEResponse,
  sendToUser,
  getActiveConnections,
  cleanupStaleConnections,
  userConnections // Exporté pour debug uniquement
};