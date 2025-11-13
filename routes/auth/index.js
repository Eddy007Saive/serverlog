const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const passport = require('../../config/passport');

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
    const user = username ? await findUserByUsername(username) : await findUserByEmail(email);
    console.log("dsdsd", user);


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
          ID: user.userId,
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

// Route d'enregistrement
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  console.log("body",req.body);
  

  try {
    // Validation des données d'entrée
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes',
        message: 'Username, email et mot de passe requis'
      });
    }

    // Vérifier que les mots de passe correspondent
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mots de passe non correspondants',
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email invalide',
        message: 'Format d\'email invalide'
      });
    }

    // Validation de la longueur du username
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username trop court',
        message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
      });
    }

    // Validation de la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe trop court',
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Importer le modèle User
    const User = require('../../services/userService');

    // Créer l'utilisateur (la validation et la vérification des doublons sont gérées par le modèle)
    const newUser = await User.createUser({
      username,
      email,
      password,
      role: 'user', // Rôle par défaut
      permissions: ['read'], // Permissions par défaut
      isActive: true
    });

    // Générer les tokens
    const { accessToken, refreshToken } = generateTokens({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      permissions: newUser.permissions
    });

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          permissions: newUser.permissions
        },
        accessToken,
        refreshToken,
        expiresIn: require('../../config/auth').JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);

    // Gérer les erreurs spécifiques
    if (error.message.includes('existe déjà')) {
      return res.status(409).json({
        success: false,
        error: 'Utilisateur existant',
        message: error.message
      });
    }

    if (error.message.includes('Validation échouée')) {
      return res.status(400).json({
        success: false,
        error: 'Validation échouée',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: 'Erreur lors de l\'inscription'
    });
  }
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



router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false 
  })(req, res, next);
});


router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
  }, async (err, user, info) => {
    try {
      // Gestion des erreurs
      if (err) {
        console.error('Erreur Passport:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_error`);
      }

      if (!user) {
        console.error('Aucun utilisateur retourné:', info);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
      }

      // Générer les tokens JWT (comme pour login classique)
      const { accessToken, refreshToken } = generateTokens(user);

      // Option 1: Redirection avec tokens en query params
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
      res.redirect(redirectUrl);

      // Option 2: Retourner JSON (si votre frontend ouvre une popup)
      // res.json({
      //   success: true,
      //   message: 'Authentification Google réussie',
      //   data: {
      //     user: {
      //       id: user.id,
      //       username: user.username,
      //       email: user.email,
      //       role: user.role,
      //       permissions: user.permissions
      //     },
      //     accessToken,
      //     refreshToken,
      //     expiresIn: require('../../config/auth').JWT_EXPIRES_IN
      //   }
      // });

    } catch (error) {
      console.error('Erreur callback Google:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
    }
  })(req, res, next);
  });

  module.exports = router;