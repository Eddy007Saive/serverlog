const express = require('express');
const router = express.Router();

const { createSSEResponse } = require('../../middleware/sse');

// 10. Endpoint de santé (maintenant en SSE)
router.get('/health', (req, res) => {
  const { sendEvent } = createSSEResponse(res);
  
  sendEvent('start', { message: 'Vérification de l\'état du serveur...' });
  
  const healthData = {
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  };
  
  sendEvent('progress', { message: 'Collecte des informations système...' });
  
  sendEvent('completed', { 
    success: true,
    message: 'Serveur en bonne santé',
    data: healthData
  });
  
  res.end();
});

module.exports = router;