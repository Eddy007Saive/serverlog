const express = require('express');
const axios = require('axios');
const router = express.Router();

const { createSSEResponse } = require('../../middleware/sse');
const pollWorkflow = require('../../utils/pollWorkflow');
const { WEBHOOK_ENDPOINTS } = require('../../config/constants');

// 5. Générer messages (ancien endpoint /api/ maintenant en SSE)
router.post('/generer/messages', async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { id, mode = 'generate' } = req.body;

  try {
    sendEvent('start', { message: 'Démarrage génération des messages...' });

    sendEvent('progress', { message: 'Envoi de la requête au webhook...' });
    
    const response = await axios.post(WEBHOOK_ENDPOINTS.GENERATE_MESSAGES, { id, mode });
    
    sendEvent('progress', { 
      message: 'Réponse reçue du webhook',
      data: response.data 
    });

    let data = response.data;
    if (data.executionUrl) {
      sendEvent('polling_start', { message: 'Démarrage du polling pour suivre l\'exécution...' });
      data = await pollWorkflow(data.executionUrl, sendEvent);
    }

    sendEvent('completed', { 
      success: true,
      message: 'Messages générés avec succès', 
      data: data
    });
    res.end();
  } catch (error) {
    sendEvent('error', { 
      success: false,
      error: error.message,
      message: 'Erreur lors de la génération des messages'
    });
    res.end();
  }
});

// 6. Régénérer messages (ancien endpoint /api/ maintenant en SSE)
router.post('/regenerer/messages', async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { id } = req.body;

  try {
    sendEvent('start', { message: 'Démarrage régénération des messages...' });

    sendEvent('progress', { message: 'Envoi de la requête au webhook...' });
    
    const response = await axios.post(WEBHOOK_ENDPOINTS.REGENERATE_MESSAGES, { id });
    
    sendEvent('progress', { 
      message: 'Réponse reçue du webhook',
      data: response.data 
    });

    let data = response.data;
    if (data.executionUrl) {
      sendEvent('polling_start', { message: 'Démarrage du polling pour suivre l\'exécution...' });
      data = await pollWorkflow(data.executionUrl, sendEvent);
    }

    sendEvent('completed', { 
      success: true,
      message: 'Messages régénérés avec succès', 
      data: data
    });
    res.end();
  } catch (error) {
    sendEvent('error', { 
      success: false,
      error: error.message,
      message: 'Erreur lors de la régénération des messages'
    });
    res.end();
  }
});

module.exports = router;