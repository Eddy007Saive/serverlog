const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const {
    generateTokens
} = require('../middleware/auth');
require('dotenv').config(); // Charge les variables d'environnement


// Import des routes
const authRoutes = require('./auth');
const campagneRoute = require('./campagne');
const contactRoute = require('./contact');


const webhookMessages = require('./webhooks/messages');
const webhookContacts = require('./webhooks/contacts');
const webhookProfiles = require('./webhooks/profiles');

const apiMessages = require('./api/messages');
const apiContacts = require('./api/contacts');
const apiExecution = require('./api/execution');
const apiHealth = require('./api/health');
const apiWebhooks = require('./api/webhooks');
const notificationRoute = require('./notification');
const configurationRoute = require('./configuration');



// Routes d'authentification
router.use('/api/auth', authRoutes);
router.use('/api/campagne', campagneRoute);
router.use('/api/contact', contactRoute);
router.use('/api/notification', notificationRoute);
router.use('/api/configuration', configurationRoute);


// Routes webhook
router.use('/webhook', webhookMessages);
router.use('/webhook', webhookContacts);
router.use('/webhook', webhookProfiles);

// Routes API
router.use('/api', apiMessages);
router.use('/api', apiContacts);
router.use('/api', apiExecution);
router.use('/api', apiHealth);
router.use('/api', apiWebhooks);

router.get('/google', (req, res, next) => {
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })(req, res, next);
});


router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', {
        session: false
    }, async (err, user, info) => {
        try {
            if (err) {
                console.error('Erreur Passport:', err);
                return res.redirect(`${process.env.FRONTEND_URL}/google-callback.html?error=auth_error`);
            }

            if (!user) {
                console.error('Aucun utilisateur retourné:', info);
                return res.redirect(`${process.env.FRONTEND_URL}/google-callback.html?error=no_user`);
            }

            // Générer les tokens JWT
            const { accessToken, refreshToken } = generateTokens(user);

            // Rediriger vers la page HTML avec les données en paramètres
            const redirectUrl = `${process.env.FRONTEND_URL}/google-callback.html?` +
                `accessToken=${accessToken}&` +
                `refreshToken=${refreshToken}&` +
                `userId=${user.id}&` +
                `email=${encodeURIComponent(user.email)}&` +
                `username=${encodeURIComponent(user.username)}&` +
                `role=${user.role}`;

                

            res.redirect(redirectUrl);

        } catch (error) {
            console.error('Erreur callback Google:', error);
            res.redirect(`${process.env.FRONTEND_URL}/google-callback.html?error=token_generation_failed`);
        }
    })(req, res, next);
});


// ==========================================
// ROUTE RACINE - Bienvenue
// ==========================================
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Bienvenue sur l\'API ServerLog',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    documentation: {
      auth: 'https://docs.votre-api.com/auth',
      webhooks: 'https://docs.votre-api.com/webhooks'
    },
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me (protected)',
        refresh: 'POST /api/auth/refresh'
      },
      health: 'GET /api/health',
      webhooks: 'GET /api/webhooks'
    }
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});



module.exports = router;