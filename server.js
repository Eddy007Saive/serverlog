const express = require('express');
const cors = require('./middleware/cors');
const { authenticate, autoAuthorize } = require('./middleware/auth');
const routes = require('./routes');
const { testAirtableConnection } = require('./config/airtable');
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Middleware CORS
app.use(cors);

app.use(passport.initialize());
// Middleware d'authentification global
app.use(authenticate);

// Middleware d'autorisation automatique basé sur l'endpoint
app.use(autoAuthorize);

// Routes principales
app.use('/', routes);

// Gestion des erreurs 404
app.use((req, res) => {
  const { createSSEResponse } = require('./middleware/sse');
  const { sendEvent } = createSSEResponse(res);
  
  sendEvent('start', { message: 'Traitement de la requête...' });
  
  sendEvent('error', { 
    success: false,
    status: 404,
    error: 'Endpoint non trouvé',
    message: `L'endpoint ${req.method} ${req.path} n'existe pas`,
    availableEndpoints: '/api/webhooks',
    suggestion: 'Consultez /api/webhooks pour voir tous les endpoints disponibles'
  });
  
  res.end();
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  const { createSSEResponse } = require('./middleware/sse');
  const { sendEvent } = createSSEResponse(res);
  
  sendEvent('error', { 
    success: false,
    status: 500,
    error: 'Erreur interne du serveur',
    message: error.message,
    timestamp: new Date().toISOString()
  });
  
  res.end();
});

(async () => {
  const isConnected = await testAirtableConnection();
  if (!isConnected) {
    console.error('❌ Arrêt du serveur car Airtable est inaccessible.');
    process.exit(1); // stoppe le serveur
  }

  // Ici tu peux configurer tes routes, middlewares, etc.
  app.use('/auth', require('./routes/auth'));

  const PORT = process.env.PORT || 3000;
})();

app.listen(PORT, () => {
  console.log(`🚀 SSE Node.js server running on port ${PORT}`);
  console.log(`📋 Liste des webhooks disponibles: http://localhost:${PORT}/api/webhooks`);
  console.log(`💚 Santé du serveur: http://localhost:${PORT}/health`);
  console.log(`🌊 Tous les endpoints utilisent maintenant Server-Sent Events (SSE)`);
});