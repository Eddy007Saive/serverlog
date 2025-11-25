module.exports = {
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  POLLING_INTERVAL: 1000,
  WEBHOOK_ENDPOINTS: {
    GENERATE_MESSAGES: 'https://n8n.srv903010.hstgr.cloud/webhook/recrutement/generer/messages',
    REGENERATE_MESSAGES: 'https://n8n.srv903010.hstgr.cloud/webhook/recrutement/regenerer/messages',
    ENRICH_CONTACTS: 'https://n8n.srv903010.hstgr.cloud/webhook/recrutement/enrichir/contacte',
    DELETE_REJECTED_CONTACTS: 'https://n8n.srv903010.hstgr.cloud/webhook/recrutement/supprimer/contact/reject',
    SORT_PROFILES: 'https://n8n.srv903010.hstgr.cloud/webhook/recrutement/trier/profils',
    RESORT_PROFILES: 'https://n8n.srv903010.hstgr.cloud/webhook/recrutement/retrier/profils'
  }
};