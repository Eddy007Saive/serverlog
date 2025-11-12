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


// Routes d'authentification
router.use('/api/auth', authRoutes);
router.use('/api/campagne', campagneRoute);
router.use('/api/contact', contactRoute);
router.use('/api/notification', notificationRoute);

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

module.exports = router;