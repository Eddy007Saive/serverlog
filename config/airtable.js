// config/airtable.js
const Airtable = require('airtable');

// Configuration Airtable
const airtableConfig = {
  apiKey: process.env.AIRTABLE_API_KEY || 'your-airtable-api-key',
  baseId: process.env.AIRTABLE_BASE_ID || 'your-base-id',
  tables: {
    users: process.env.AIRTABLE_USERS_TABLE || 'Users',
    sessions: process.env.AIRTABLE_SESSIONS_TABLE || 'Sessions',
    logs: process.env.AIRTABLE_LOGS_TABLE || 'Logs'
  }
};

// Initialiser Airtable
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: airtableConfig.apiKey
});

const base = Airtable.base(airtableConfig.baseId);

// Utilitaires pour Airtable
const airtableUtils = {
  // Convertir un record Airtable en objet simple
  recordToObject: (record) => {
    return {
      id: record.id,
      ...record.fields,
      createdTime: record._rawJson.createdTime
    };
  },

  // Filtrer les champs vides
  filterEmptyFields: (fields) => {
    const filtered = {};
    Object.keys(fields).forEach(key => {
      if (fields[key] !== null && fields[key] !== undefined && fields[key] !== '') {
        filtered[key] = fields[key];
      }
    });
    return filtered;
  },

  // Gérer les erreurs Airtable
  handleAirtableError: (error) => {
    console.error('Airtable Error:', error);
    
    if (error.error?.type === 'INVALID_REQUEST_MISSING_FIELDS') {
      return { 
        type: 'VALIDATION_ERROR', 
        message: 'Champs requis manquants', 
        details: error.error.message 
      };
    }
    
    if (error.error?.type === 'NOT_FOUND') {
      return { 
        type: 'NOT_FOUND', 
        message: 'Enregistrement non trouvé' 
      };
    }
    
    if (error.statusCode === 422) {
      return { 
        type: 'INVALID_DATA', 
        message: 'Données invalides', 
        details: error.error?.message 
      };
    }
    
    return { 
      type: 'UNKNOWN_ERROR', 
      message: 'Erreur inconnue', 
      details: error.message 
    };
  }
};

module.exports = {
  base,
  airtableConfig,
  airtableUtils
};