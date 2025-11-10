// config/role.js
const roles = {
  admin: {
    campagnes: ['read', 'write', 'delete'],
    contacts: ['read', 'write', 'delete']
  },
  user: {
    campagnes: ['read', 'write', 'delete'], 
    contacts: ['read', 'write', 'delete']   
  }
};

module.exports = roles; 