const express = require('express');
const axios = require('axios');
const router = express.Router();

const { createSSEResponse } = require('../../middleware/sse');
const pollWorkflow = require('../../utils/pollWorkflow');
const { WEBHOOK_ENDPOINTS } = require('../../config/constants');

// 1. Générer des messages personnalisés
router.post('/generer/messages', async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { id, mode = 'generate' } = req.body;

  try {
    sendEvent('start', { message: 'Génération des messages personnalisés...' });
    console.log("debut génération des messages");

    const response = await axios.post(WEBHOOK_ENDPOINTS.GENERATE_MESSAGES, { id, mode });
    
    let data = response.data;
    sendEvent('progress', { data });

    if (data.executionUrl) {
      data = await pollWorkflow(data.executionUrl, sendEvent);
    }

    sendEvent('completed', { 
      message: 'Messages générés avec succès', 
      result: data 
    });
    res.end();
  } catch (error) {
    sendEvent('error', { 
      error: error.message,
      message: 'Erreur lors de la génération des messages'
    });
    res.end();
  }
});

// 2. Régénérer des messages existants
router.post('/regenerer/messages', async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { id } = req.body;

  try {
    sendEvent('start', { message: 'Régénération des messages...' });

    const response = await axios.post(WEBHOOK_ENDPOINTS.REGENERATE_MESSAGES, { id });
    
    let data = response.data;
    sendEvent('progress', { data });

    if (data.executionUrl) {
      data = await pollWorkflow(data.executionUrl, sendEvent);
    }

    sendEvent('completed', { 
      message: 'Messages régénérés avec succès', 
      result: data 
    });
    res.end();
  } catch (error) {
    sendEvent('error', { 
      error: error.message,
      message: 'Erreur lors de la régénération des messages'
    });
    res.end();
  }
});

module.exports = router;