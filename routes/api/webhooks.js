const express = require('express');
const router = express.Router();

const { createSSEResponse } = require('../../middleware/sse');

// 11. Liste des webhooks disponibles (maintenant en SSE)
router.get('/webhooks', (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  
  sendEvent('start', { message: 'Récupération de la liste des webhooks...' });
  
  const webhooks = [
    { path: '/api/auth/login', method: 'POST', description: 'Connexion utilisateur', auth: false },
    { path: '/api/auth/refresh', method: 'POST', description: 'Rafraîchir le token', auth: false },
    { path: '/api/auth/logout', method: 'POST', description: 'Déconnexion utilisateur', auth: true },
    { path: '/auth/me', method: 'GET', description: 'Informations utilisateur', auth: true },
    { path: '/auth/change-password', method: 'POST', description: 'Changer mot de passe', auth: true },
    { path: '/webhook/trier/profils', method: 'POST', description: 'Trier Profil (SSE)', auth: true, permissions: ['write'] },
    { path: '/webhook/retrier/profils', method: 'POST', description: 'Retrier profil (SSE)', auth: true, permissions: ['write'] },
    { path: '/webhook/generer/messages', method: 'POST', description: 'Générer des messages personnalisés (SSE)', auth: true, permissions: ['write'] },
    { path: '/webhook/regenerer/messages', method: 'POST', description: 'Régénérer des messages (SSE)', auth: true, permissions: ['write'] },
    { path: '/webhook/enrichir/contacte', method: 'POST', description: 'Enrichir les contacts (SSE)', auth: true, permissions: ['write'] },
    { path: '/webhook/supprimer/contact/reject', method: 'POST', description: 'Supprimer contacts rejetés (SSE)', auth: true, permissions: ['delete'] },
    { path: '/api/generer/messages', method: 'POST', description: 'Générer des messages (SSE)', auth: true, permissions: ['write'] },
    { path: '/api/regenerer/messages', method: 'POST', description: 'Régénérer des messages (SSE)', auth: true, permissions: ['write'] },
    { path: '/api/enrichir/contacte', method: 'POST', description: 'Enrichir les contacts (SSE)', auth: true, permissions: ['write'] },
    { path: '/api/supprimer/contact/reject', method: 'POST', description: 'Supprimer contacts rejetés (SSE)', auth: true, permissions: ['delete'] },
    { path: '/api/execution/:executionId', method: 'GET', description: 'Vérifier l\'état d\'une exécution (SSE)', auth: true, permissions: ['read'] },
    { path: '/health', method: 'GET', description: 'Vérifier l\'état du serveur (SSE)', auth: false },
    { path: '/api/webhooks', method: 'GET', description: 'Liste des webhooks disponibles (SSE)', auth: false },
    { path: '/api/webhooks', method: 'GET', description: 'Liste des webhooks disponibles (SSE)' }
  ];
  
  sendEvent('progress', { message: 'Liste des endpoints compilée' });
  
  sendEvent('completed', {
    success: true,
    message: 'Liste des webhooks récupérée avec succès',
    data: {
      webhooks,
      total: webhooks.length,
      note: 'Tous les endpoints utilisent maintenant Server-Sent Events (SSE) pour le streaming en temps réel'
    }
  });
  
  res.end();
});

module.exports = router;