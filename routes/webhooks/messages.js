const express = require('express');
const axios = require('axios');
const router = express.Router();

const { createSSEResponse, sendToUser } = require('../../middleware/sse');
const pollWorkflow = require('../../utils/pollWorkflow');
const { WEBHOOK_ENDPOINTS } = require('../../config/constants');
const { authenticate, authorize } = require('../../middleware/auth');

// 1. Générer des messages personnalisés
router.post('/generer/messages', 
  authenticate,
  authorize('campagnes', 'write'), // ou 'read' selon vos besoins
  async (req, res) => {
    const { id, mode = 'generate' } = req.body;
    const userId = req.user.id;

    // ⚠️ IMPORTANT: Passer userId et req
    const { sendEvent } = createSSEResponse(res, userId, req);

    try {
      sendEvent('start', { message: 'Génération des messages personnalisés...' });
      console.log(`🚀 Début génération des messages pour user ${userId}, campagne ${id}`);

      const response = await axios.post(WEBHOOK_ENDPOINTS.GENERATE_MESSAGES, { id, mode });
      
      let data = response.data;
      sendEvent('progress', { data });

      if (data.executionUrl) {
        // Utiliser sendToUser pour cibler uniquement cet utilisateur
        data = await pollWorkflow(data.executionUrl, (event, eventData) => {
          sendToUser(userId, event, eventData);
        });
      }

      sendEvent('completed', { 
        message: 'Messages générés avec succès', 
        result: data 
      });
      console.log(`✅ Génération terminée pour user ${userId}, campagne ${id}`);
      res.end();
    } catch (error) {
      console.error(`❌ Erreur génération pour user ${userId}:`, error.message);
      sendEvent('error', { 
        error: error.message,
        message: 'Erreur lors de la génération des messages'
      });
      res.end();
    }
  }
);

// 2. Régénérer des messages existants
router.post('/regenerer/messages', 
  authenticate,
  authorize('campagnes', 'write'),
  async (req, res) => {
    const { id } = req.body;
    const userId = req.user.id;

    const { sendEvent } = createSSEResponse(res, userId, req);

    try {
      sendEvent('start', { message: 'Régénération des messages...' });
      console.log(`🔄 Début régénération des messages pour user ${userId}, campagne ${id}`);

      const response = await axios.post(WEBHOOK_ENDPOINTS.REGENERATE_MESSAGES, { id });
      
      let data = response.data;
      sendEvent('progress', { data });

      if (data.executionUrl) {
        data = await pollWorkflow(data.executionUrl, (event, eventData) => {
          sendToUser(userId, event, eventData);
        });
      }

      sendEvent('completed', { 
        message: 'Messages régénérés avec succès', 
        result: data 
      });
      console.log(`✅ Régénération terminée pour user ${userId}, campagne ${id}`);
      res.end();
    } catch (error) {
      console.error(`❌ Erreur régénération pour user ${userId}:`, error.message);
      sendEvent('error', { 
        error: error.message,
        message: 'Erreur lors de la régénération des messages'
      });
      res.end();
    }
  }
);

module.exports = router;