const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./auth');
const campagneRoute = require('./campagne');

const webhookMessages = require('./webhooks/messages');
const webhookContacts = require('./webhooks/contacts');
const webhookProfiles = require('./webhooks/profiles');

const apiMessages = require('./api/messages');
const apiContacts = require('./api/contacts');
const apiExecution = require('./api/execution');
const apiHealth = require('./api/health');
const apiWebhooks = require('./api/webhooks');

// Routes d'authentification
router.use('/api/auth', authRoutes);
router.use('/api/campagne', campagneRoute);

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

module.exports = router;