const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { 
  comparePassword, 
  generateTokens, 
  findUserByUsername,
  findUserByEmail,
  findUserById,
  hashPassword
} = require('../../middleware/auth');
const { JWT_SECRET } = require('../../config/auth');

// Fonction utilitaire pour envoyer une réponse (JSON seulement)
const sendResponse = (req, res, data) => {
  const statusCode = data.success ? 200 : (data.status || 500);
  res.status(statusCode).json(data);
};

// Route de connexion (JSON seulement)
router.post('/login', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // Validation des données d'entrée
    if ((!username && !email) || !password) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        message: 'Username/Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur
    const user = username ? findUserByUsername(username) : findUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé',
        message: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect',
        message: 'Identifiants invalides'
      });
    }

    // Générer les tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        },
        accessToken,
        refreshToken,
        expiresIn: require('../../config/auth').JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: 'Erreur lors de la connexion'
    });
  }
});

// Route de rafraîchissement du token (JSON seulement)
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Token manquant',
        message: 'Refresh token requis'
      });
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Trouver l'utilisateur
    const user = findUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé',
        message: 'Refresh token invalide'
      });
    }

    // Générer de nouveaux tokens
    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: require('../../config/auth').JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Erreur lors du rafraîchissement:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide',
      message: 'Refresh token invalide ou expiré'
    });
  }
});

// Route de déconnexion (JSON seulement)
router.post('/logout', (req, res) => {
  // Note: Avec JWT, la déconnexion côté serveur est limitée
  // En production, vous pourriez maintenir une blacklist des tokens
  res.json({
    success: true,
    message: 'Déconnexion réussie',
    data: {
      note: 'Supprimez le token côté client pour compléter la déconnexion'
    }
  });
});

// Route pour obtenir les informations de l'utilisateur actuel (nécessite authentification)
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Non authentifié',
      message: 'Token d\'authentification requis'
    });
  }

  res.json({
    success: true,
    message: 'Informations utilisateur récupérées',
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        permissions: req.user.permissions
      }
    }
  });
});

// Route d'enregistrement (optionnelle - désactivée par défaut)
router.post('/register', async (req, res) => {
  // Désactivé par défaut pour sécurité
  res.status(403).json({
    success: false,
    error: 'Enregistrement désactivé',
    message: 'L\'enregistrement de nouveaux utilisateurs est désactivé'
  });
});

// Route pour changer le mot de passe (nécessite authentification)
router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié',
        message: 'Authentification requise'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    const user = findUserById(req.user.id);
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect',
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Note: En production, vous devriez mettre à jour la base de données
    const hashedNewPassword = await hashPassword(newPassword);

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès',
      data: {
        note: 'En production, le mot de passe serait mis à jour dans la base de données'
      }
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: 'Erreur lors du changement de mot de passe'
    });
  }
});

// Route de test de la santé de l'API auth
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service d\'authentification opérationnel',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;