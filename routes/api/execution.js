const express = require('express');
const axios = require('axios');
const router = express.Router();

const { createSSEResponse } = require('../../middleware/sse');

// 9. Vérifier l'état d'une exécution (maintenant en SSE)
router.get('/execution/:executionId', async (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  const { executionId } = req.params;

  try {
    sendEvent('start', { message: `Vérification de l'exécution ${executionId}...` });

    const executionUrl = `https://n8n.srv903010.hstgr.cloud/api/v1/executions/${executionId}`;
    sendEvent('progress', { message: 'Récupération des informations d\'exécution...' });
    
    const response = await axios.get(executionUrl);
    
    sendEvent('progress', { message: 'Données d\'exécution récupérées' });

    sendEvent('completed', { 
      success: true,
      message: 'Informations d\'exécution récupérées avec succès',
      data: response.data 
    });
    res.end();
  } catch (error) {
    sendEvent('error', { 
      success: false,
      error: error.message,
      message: 'Erreur lors de la récupération des informations d\'exécution'
    });
    res.end();
  }
});

module.exports = router;