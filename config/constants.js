module.exports = {
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  POLLING_INTERVAL: 1000,
  WEBHOOK_ENDPOINTS: {
    GENERATE_MESSAGES: 'https://n8n.srv903010.hstgr.cloud/webhook/generer/messages',
    REGENERATE_MESSAGES: 'https://n8n.srv903010.hstgr.cloud/webhook/regenerer/messages',
    ENRICH_CONTACTS: 'https://n8n.srv903010.hstgr.cloud/webhook/enrichir/contacte',
    DELETE_REJECTED_CONTACTS: 'https://n8n.srv903010.hstgr.cloud/webhook/supprimer/contact/reject',
    SORT_PROFILES: 'https://n8n.srv903010.hstgr.cloud/webhook/trier/profils',
    RESORT_PROFILES: 'https://n8n.srv903010.hstgr.cloud/webhook/retrier/profils'
  }
};