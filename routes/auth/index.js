// routes/auth/index.js
const express = require('express');
const router = express.Router();
const passport = require('../../config/passport');
const { authenticate } = require('../../middleware/auth');
const authController = require('../../controllers/authController');

// ==========================================
// ROUTES PUBLIQUES (sans authentification)
// ==========================================

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /api/auth/login
 * @desc Connexion utilisateur
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route POST /api/auth/refresh
 * @desc Rafraîchir le token d'accès
 * @access Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route GET /api/auth/health
 * @desc Vérifier la santé du service
 * @access Public
 */
router.get('/health', authController.health);

// ==========================================
// ROUTES GOOGLE OAUTH
// ==========================================

/**
 * @route GET /api/auth/google
 * @desc Initier l'authentification Google OAuth
 * @access Public
 */
router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false 
  })(req, res, next);
});

/**
 * @route GET /api/auth/google/callback
 * @desc Callback Google OAuth
 * @access Public
 */
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
  }, (err, user, info) => {
    authController.googleCallback(err, user, info, req, res);
  })(req, res, next);
});

// ==========================================
// ROUTES PROTÉGÉES (avec authentification)
// ==========================================

/**
 * @route GET /api/auth/me
 * @desc Obtenir les informations de l'utilisateur connecté
 * @access Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route POST /api/auth/logout
 * @desc Déconnexion utilisateur
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route POST /api/auth/change-password
 * @desc Changer le mot de passe
 * @access Private
 */
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;