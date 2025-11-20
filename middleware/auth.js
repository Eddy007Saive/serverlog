// middleware/auth.js (Version Airtable)
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET, PUBLIC_ENDPOINTS, ENDPOINT_PERMISSIONS } = require('../config/auth');
const User = require('../services/userService');
const roles = require('../config/role');

// Middleware pour vérifier l'authentification
const authenticate = async (req, res, next) => {
  // Vérifier si l'endpoint est public
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => 
    req.path === endpoint || req.path.startsWith(endpoint)
  );
  
  if (isPublicEndpoint) {
    return next();
  }


  // Récupérer le token depuis les headers
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log(`❌ Token manquant pour: ${req.path}`);
    return res.status(401).json({
      success: false,
      error: 'Token manquant',
      message: 'Token d\'authentification requis'
    });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(decoded);
    
    
    
    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log(`❌ Utilisateur non trouvé pour ID: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé',
        message: 'Token d\'authentification invalide'
      });
    }

    if (!user.isActive) {
      console.log(`❌ Utilisateur inactif: ${user.username}`);
      return res.status(401).json({
        success: false,
        error: 'Compte inactif',
        message: 'Votre compte a été désactivé'
      });
    }
    
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide',
      message: 'Token d\'authentification invalide ou expiré'
    });
  }
};


const authorize = (resource, action) => {
  return async (req, res, next) => {
    const user = req.user;
    
    if (!user) return res.status(401).json({ message: 'Non authentifié' });

    // Récupérer les permissions réelles depuis la base
    const rolePermissions = roles[user.role] || {};
    const resourcePermissions = rolePermissions[resource] || [];
    

    if (user.role !== 'admin' && !resourcePermissions.includes(action)) {
      return res.status(403).json({ message: `Accès refusé: ${action} sur ${resource}` });
    }

    next();
  };
};


// Middleware automatique de permissions basé sur l'endpoint
const autoAuthorize = (req, res, next) => {
  const path = req.path;
  const requiredPermissions = ENDPOINT_PERMISSIONS[path] || [];
  
  if (requiredPermissions.length > 0) {
    return authorize(requiredPermissions)(req, res, next);
  }
  
  next();
};

// Middleware de debugging pour les routes
const debugRoutes = (req, res, next) => {
  next();
};

// Utilitaires d'authentification
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateTokens = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: require('../config/auth').JWT_EXPIRES_IN 
  });
  
  const refreshToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: require('../config/auth').REFRESH_TOKEN_EXPIRES_IN 
  });

  return { accessToken, refreshToken };
};

// Fonctions de recherche d'utilisateurs (maintenant avec Airtable)
const findUserByUsername = async (username) => {
  try {
    return await User.findByUsername(username);
  } catch (error) {
    console.error('Erreur lors de la recherche par nom d\'utilisateur:', error);
    return null;
  }
};

const findUserByEmail = async (email) => {
  try {
    return await User.findByEmail(email);
  } catch (error) {
    console.error('Erreur lors de la recherche par email:', error);
    return null;
  }
};

const findUserById = async (id) => {
  try {
    return await User.findById(id);
  } catch (error) {
    console.error('Erreur lors de la recherche par ID:', error);
    return null;
  }
};

module.exports = {
  authenticate,
  authorize,
  autoAuthorize,
  debugRoutes,
  hashPassword,
  comparePassword,
  generateTokens,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  User // Export du modèle pour usage direct
};