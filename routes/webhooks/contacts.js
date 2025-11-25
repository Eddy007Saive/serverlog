const express = require('express');
const axios = require('axios');
const router = express.Router();

const { createSSEResponse } = require('../../middleware/sse');
const pollWorkflow = require('../../utils/pollWorkflow');
const { WEBHOOK_ENDPOINTS } = require('../../config/constants');
const { authenticate, authorize } = require('../../middleware/auth');

// 3. Enrichir les contacts
router.post('/enrichir/contacte', authenticate,
  authorize('campagnes', 'read'),async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { id } = req.body;
  const user=req.user.id;

  try {
    sendEvent('start', { message: 'Enrichissement des contacts en cours...' });

    const response = await axios.post(WEBHOOK_ENDPOINTS.ENRICH_CONTACTS, { id });
    
    let data = response.data;
    sendEvent('progress', { data });

    if (data.executionUrl) {
      data = await pollWorkflow(data.executionUrl, sendEvent);
    }

    sendEvent('completed', { 
      message: 'Enrichissement terminé avec succès', 
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

// 4. Supprimer les contacts rejetés
router.post('/supprimer/contact/reject', async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { id } = req.body;

  try {
    sendEvent('start', { message: 'Suppression des contacts rejetés...' });

    const response = await axios.post(WEBHOOK_ENDPOINTS.DELETE_REJECTED_CONTACTS, { id });
    
    let data = response.data;
    sendEvent('progress', { data });

    if (data.executionUrl) {
      data = await pollWorkflow(data.executionUrl, sendEvent);
    }

    sendEvent('completed', { 
      message: 'Contacts rejetés supprimés avec succès', 
      result: data 
    });
    res.end();
  } catch (error) {
    sendEvent('error', { 
      error: error.message,
      message: 'Erreur lors de la suppression'
    });
    res.end();
  }
});

module.exports = router;