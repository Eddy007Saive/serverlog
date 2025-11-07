const express = require('express');
const axios = require('axios');
const router = express.Router();

const { createSSEResponse } = require('../../middleware/sse');
const pollWorkflow = require('../../utils/pollWorkflow');
const { WEBHOOK_ENDPOINTS } = require('../../config/constants');

// Trier les profils
router.post('/trier/profils', async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { id } = req.body;

  try {
    sendEvent('start', { message: 'Triage des validation des profils en cours...' });

    const response = await axios.post(WEBHOOK_ENDPOINTS.SORT_PROFILES, { id });
    
    let data = response.data;
    sendEvent('progress', { data });

    if (data.executionUrl) {
      data = await pollWorkflow(data.executionUrl, sendEvent);
    }

    sendEvent('completed', { 
      message: 'Triage Terminé terminé avec succès', 
      result: data 
    });
    res.end();
  } catch (error) {
    sendEvent('error', { 
      error: error.message,
      message: 'Erreur lors du triage'
    });
    res.end();
  }
});

// Retrier les profils
router.post('/retrier/profils', async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { id } = req.body;

  try {
    sendEvent('start', { message: 'Validation des profil en cours...' });

    const response = await axios.post(WEBHOOK_ENDPOINTS.RESORT_PROFILES, { id });
    
    let data = response.data;
    sendEvent('progress', { data });

    if (data.executionUrl) {
      data = await pollWorkflow(data.executionUrl, sendEvent);
    }

    sendEvent('completed', { 
      message: 'Trie terminé avec succès', 
      result: data 
    });
    res.end();
  } catch (error) {
    sendEvent('error', { 
      error: error.message,
      message: 'Erreur lors de l\'enrichissement'
    });
    res.end();
  }
});

module.exports = router;