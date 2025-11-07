const express = require('express');
const axios = require('axios');
const router = express.Router();

const { createSSEResponse } = require('../../middleware/sse');
const pollWorkflow = require('../../utils/pollWorkflow');
const { WEBHOOK_ENDPOINTS } = require('../../config/constants');

// 7. Enrichir contacts (ancien endpoint /api/ maintenant en SSE)
router.post('/enrichir/contacte', async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { id } = req.body;

  try {
    sendEvent('start', { message: 'Démarrage enrichissement des contacts...' });

    sendEvent('progress', { message: 'Envoi de la requête au webhook...' });
    
    const response = await axios.post(WEBHOOK_ENDPOINTS.ENRICH_CONTACTS, { id });
    
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
      message: 'Enrichissement lancé avec succès', 
      data: data
    });
    res.end();
  } catch (error) {
    sendEvent('error', { 
      success: false,
      error: error.message,
      message: 'Erreur lors de l\'enrichissement'
    });
    res.end();
  }
});

// 8. Supprimer contacts rejetés (ancien endpoint /api/ maintenant en SSE)
router.post('/supprimer/contact/reject', async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { id } = req.body;

  try {
    sendEvent('start', { message: 'Démarrage suppression des contacts rejetés...' });

    sendEvent('progress', { message: 'Envoi de la requête au webhook...' });
    
    const response = await axios.post(WEBHOOK_ENDPOINTS.DELETE_REJECTED_CONTACTS, { id });
    
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
      message: 'Contacts rejetés supprimés avec succès', 
      data: data
    });
    res.end();
  } catch (error) {
    sendEvent('error', { 
      success: false,
      error: error.message,
      message: 'Erreur lors de la suppression'
    });
    res.end();
  }
});

module.exports = router;