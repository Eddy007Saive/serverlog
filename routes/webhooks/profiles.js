const express = require('express');
const axios = require('axios');
const router = express.Router();

const { createSSEResponse, sendToUser } = require('../../middleware/sse');
const pollWorkflow = require('../../utils/pollWorkflow');
const { WEBHOOK_ENDPOINTS } = require('../../config/constants');
const { authenticate, authorize } = require('../../middleware/auth');

// Trier les profils
router.post('/trier/profils', 
  authenticate,
  authorize('campagnes', 'write'),
  async (req, res) => {
    const { id } = req.body;
    const userId = req.user.id;

    const { sendEvent } = createSSEResponse(res, userId, req);

    try {
      sendEvent('start', { message: 'Triage et validation des profils en cours...' });
      console.log(`🔍 Début triage des profils pour user ${userId}, campagne ${id}`);

      const response = await axios.post(WEBHOOK_ENDPOINTS.SORT_PROFILES, { id });
      
      let data = response.data;
      sendEvent('progress', { data });

      if (data.executionUrl) {
        data = await pollWorkflow(data.executionUrl, (event, eventData) => {
          sendToUser(userId, event, eventData);
        });
      }

      sendEvent('completed', { 
        message: 'Triage terminé avec succès', 
        result: data 
      });
      console.log(`✅ Triage terminé pour user ${userId}, campagne ${id}`);
      res.end();
    } catch (error) {
      console.error(`❌ Erreur triage pour user ${userId}:`, error.message);
      sendEvent('error', { 
        error: error.message,
        message: 'Erreur lors du triage'
      });
      res.end();
    }
  }
);

// Retrier les profils
router.post('/retrier/profils', 
  authenticate,
  authorize('campagnes', 'write'),
  async (req, res) => {
    const { id } = req.body;
    const userId = req.user.id;

    const { sendEvent } = createSSEResponse(res, userId, req);

    try {
      sendEvent('start', { message: 'Validation des profils en cours...' });
      console.log(`🔄 Début re-triage des profils pour user ${userId}, campagne ${id}`);

      const response = await axios.post(WEBHOOK_ENDPOINTS.RESORT_PROFILES, { id });
      
      let data = response.data;
      sendEvent('progress', { data });

      if (data.executionUrl) {
        data = await pollWorkflow(data.executionUrl, (event, eventData) => {
          sendToUser(userId, event, eventData);
        });
      }

      sendEvent('completed', { 
        message: 'Tri terminé avec succès', 
        result: data 
      });
      console.log(`✅ Re-triage terminé pour user ${userId}, campagne ${id}`);
      res.end();
    } catch (error) {
      console.error(`❌ Erreur re-triage pour user ${userId}:`, error.message);
      sendEvent('error', { 
        error: error.message,
        message: 'Erreur lors du tri'
      });
      res.end();
    }
  }
);

module.exports = router;