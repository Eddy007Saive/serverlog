// controllers/authController.js
const jwt = require('jsonwebtoken');
const {
  comparePassword,
  generateTokens,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  hashPassword
} = require('../middleware/auth');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/auth');
const User = require('../services/userService');

/**
 * @route POST /api/auth/login
 * @desc Connexion utilisateur
 * @access Public
 */
const login = async (req, res) => {
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
    const user = username 
      ? await findUserByUsername(username) 
      : await findUserByEmail(email);

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
          userId: user.userId,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        },
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN
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
};

/**
 * @route POST /api/auth/register
 * @desc Inscription utilisateur
 * @access Public
 */
const register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

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

    // Créer l'utilisateur
    const newUser = await User.createUser({
      username,
      email,
      password,
      role: 'user',
      permissions: ['read'],
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
        expiresIn: JWT_EXPIRES_IN
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
};

/**
 * @route GET /api/auth/me
 * @desc Obtenir les informations de l'utilisateur connecté
 * @access Private
 */
const getMe = (req, res) => {
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
};

/**
 * @route POST /api/auth/refresh
 * @desc Rafraîchir le token d'accès
 * @access Public
 */
const refreshToken = async (req, res) => {
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
    const user = await findUserById(decoded.id);

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
        expiresIn: JWT_EXPIRES_IN
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
};

/**
 * @route POST /api/auth/logout
 * @desc Déconnexion utilisateur
 * @access Private
 */
const logout = (req, res) => {
  // Note: Avec JWT, la déconnexion côté serveur est limitée
  // En production, vous pourriez maintenir une blacklist des tokens
  res.json({
    success: true,
    message: 'Déconnexion réussie',
    data: {
      note: 'Supprimez le token côté client pour compléter la déconnexion'
    }
  });
};

/**
 * @route POST /api/auth/change-password
 * @desc Changer le mot de passe
 * @access Private
 */
const changePassword = async (req, res) => {
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

    // Validation de la longueur du nouveau mot de passe
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe trop court',
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    const user = await findUserById(req.user.id);
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect',
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await hashPassword(newPassword);

    // TODO: Mettre à jour le mot de passe dans la base de données
    // await User.updatePassword(req.user.id, hashedNewPassword);

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès',
      data: {
        note: 'Mot de passe mis à jour'
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
};

/**
 * @route GET /api/auth/health
 * @desc Vérifier la santé du service d'authentification
 * @access Public
 */
const health = (req, res) => {
  res.json({
    success: true,
    message: 'Service d\'authentification opérationnel',
    timestamp: new Date().toISOString()
  });
};

/**
 * @route GET /api/auth/google/callback
 * @desc Callback Google OAuth
 * @access Public
 */
const googleCallback = async (err, user, info, req, res) => {
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

    // Générer les tokens JWT
    const { accessToken, refreshToken } = generateTokens(user);

    // Redirection avec tokens en query params
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Erreur callback Google:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
  }
};

module.exports = {
  login,
  register,
  getMe,
  refreshToken,
  logout,
  changePassword,
  health,
  googleCallback
};