module.exports = {
  // Clé secrète pour JWT (à changer en production et mettre dans les variables d'environnement)
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  
  // Durée d'expiration des tokens
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Durée d'expiration des refresh tokens
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  
  // Salt rounds pour bcrypt
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
  
  // Liste des utilisateurs autorisés (en production, utiliser une base de données)
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
      // Mot de passe: 'user123' (hashé)
      password: '$2b$12$9Rr2ZZwMz6gY5SK4Rr2ZZwMz6gY5SK4Rr2ZZwMz6gY5SK4Rr2ZZwMz',
      role: 'user',
      permissions: ['read', 'write']
    }
  ],
  
  // Endpoints publics (ne nécessitent pas d'authentification)
  PUBLIC_ENDPOINTS: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/health',
    '/favicon.ico',
    '/api/webhooks'
  ],
  
  // Permissions requises par endpoint
  ENDPOINT_PERMISSIONS: {
    '/webhook/generer/messages': ['write'],
    '/webhook/regenerer/messages': ['write'],
    '/webhook/enrichir/contacte': ['write'],
    '/webhook/supprimer/contact/reject': ['delete'],
    '/webhook/trier/profils': ['write'],
    '/webhook/retrier/profils': ['write'],
    '/api/generer/messages': ['write'],
    '/api/regenerer/messages': ['write'],
    '/api/enrichir/contacte': ['write'],
    '/api/supprimer/contact/reject': ['delete'],
    '/api/execution': ['read']
  }
};