const axios = require('axios');
const { N8N_WEBHOOK_URL, POLLING_INTERVAL } = require('../config/constants');

// Fonction utilitaire pour le polling de workflow
const pollWorkflow = async (executionUrl, sendEvent) => {
  let data = { executionUrl, finished: false };
  
  while (data.executionUrl && !data.finished) {
    try {
      const path = data.executionUrl.split('/').slice(3).join('/');
      data.executionUrl = `${N8N_WEBHOOK_URL}${path}`;
      
      sendEvent('step', { 
        message: "Vérification de l'état...", 
        executionUrl: data.executionUrl 
      });

      const statusRes = await axios.get(data.executionUrl);
      data = statusRes.data;
      sendEvent('update', { data });

      if (!data.finished) {
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      }
    } catch (error) {
      sendEvent('error', { error: error.message });
      break;
    }
  }
  
  return data;
};

module.exports = pollWorkflow;