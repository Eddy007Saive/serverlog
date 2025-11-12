module.exports = {
  // Configuration JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
  
  // Utilisateurs autorisés
  AUTHORIZED_USERS: [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      password: '$2b$12$8Qq1YYvLz5fX4RJ3Qq1YYvLz5fX4RJ3Qq1YYvLz5fX4RJ3Qq1YYvLz',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin']
    },
    {
      id: 2,
      username: 'user',
      email: 'user@example.com',
      password: '$2b$12$9Rr2ZZwMz6gY5SK4Rr2ZZwMz6gY5SK4Rr2ZZwMz6gY5SK4Rr2ZZwMz',
      role: 'user',
      permissions: ['read', 'write']
    }
  ],
  
  // Endpoints publics (ne nécessitent pas d'authentification)
  PUBLIC_ENDPOINTS: [
    '/google',
    '/google/callback',
    '/api/auth/google',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/health',
    '/favicon.ico',
    '/api/webhooks'
    // Les campagnes ne sont PAS publiques - elles nécessitent une authentification
  ],
  
  // Permissions requises par endpoint
  ENDPOINT_PERMISSIONS: {
    // Webhooks existants
    '/webhook/generer/messages': ['write'],
    '/webhook/regenerer/messages': ['write'],
    '/webhook/enrichir/contacte': ['write'],
    '/webhook/supprimer/contact/reject': ['delete'],
    '/webhook/trier/profils': ['write'],
    '/webhook/retrier/profils': ['write'],
    
    // API existantes
    '/api/generer/messages': ['write'],
    '/api/regenerer/messages': ['write'],
    '/api/enrichir/contacte': ['write'],
    '/api/supprimer/contact/reject': ['delete'],
    '/api/execution': ['read'],
    
    // CAMPAGNES - Endpoints protégés
    '/api/campagnes': ['read', 'write'], 
    '/api/campagnes/user': ['read', 'write'],
    '/api/campagnes/:id': ['read', 'write', 'delete'], 
    '/api/campagnes/:id/lancer': ['write'],           
    '/api/campagnes/stats': ['read'],                
    '/api/campagnes/search': ['read']

  }
};