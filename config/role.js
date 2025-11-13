// config/role.js
const roles = {
  admin: {
    campagnes: ['read', 'write', 'delete'],
    contacts: ['read', 'write', 'delete'],
    notifications: ['read', 'write', 'delete'],
    configurations: ['read', 'write', 'delete']

  },
  user: {
    campagnes: ['read', 'write', 'delete'], 
    contacts: ['read', 'write', 'delete'],
    notifications: ['read', 'write', 'delete'],
    configurations: ['read', 'write', 'delete']


  }
};

module.exports = roles; 