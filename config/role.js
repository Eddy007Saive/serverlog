// config/role.js
const roles = {
  admin: {
    campagnes: ['read', 'write', 'delete'],
    contacts: ['read', 'write', 'delete'],
    notifications: ['read', 'write', 'delete'],
    configurations: ['read', 'write', 'delete'],
    webhooks: ['read', 'write', 'create']  // ← AJOUTEZ CECI
  },
  user: {
    campagnes: ['read', 'write', 'delete'], 
    contacts: ['read', 'write', 'delete'],
    notifications: ['read', 'write', 'delete'],
    configurations: ['read', 'write', 'delete'],
    webhooks: ['create', 'write']  // ← AJOUTEZ CECI
  }
};

module.exports = roles;