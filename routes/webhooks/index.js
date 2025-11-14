const express = require('express');
const router = express.Router();
; // Charge les variables d'environnement


const webhookMessages = require('./messages');
const webhookContacts = require('./contacts');
const webhookProfiles = require('./profiles');

// Routes webhook
router.use('/webhook', webhookMessages);
router.use('/webhook', webhookContacts);
router.use('/webhook', webhookProfiles);


module.exports = router;