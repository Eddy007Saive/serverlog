// routes/contacts.js
const express = require('express');
const router = express.Router();
const ContactController = require('../../controllers/ContactController');
const { authenticate, authorize } = require('../../middleware/auth');

// Créer une campagne
router.post(
  '/',
  authenticate,
  authorize('contacts', 'write'),
  ContactController.createContact
);

// Récupérer toutes les contacts de l'utilisateur (ou toutes si admin)
router.get(
  '/',
  authenticate,
  authorize('contacts', 'read'),
  ContactController.getContacts
);

router.get(
  '/stats',
  authenticate,
  authorize('contacts', 'read'),
  ContactController.getContactsStats
);

router.get(
  '/user',
  authenticate,
  authorize('contacts', 'read'),
  ContactController.getContactsByUser
);

router.get(
  '/campaigns/:id/details',
  authenticate,
  authorize('contacts', 'read'),
  ContactController.getContactsByCampagne
);



// Récupérer une campagne par ID
router.get(
  '/:id',
  authenticate,
  authorize('contacts', 'read'),
  ContactController.getContactById
);

// Mettre à jour une campagne
router.patch(
  '/:id',
  authenticate,
  authorize('contacts', 'write'),
  ContactController.updateContact
);

// Supprimer une campagne
router.delete(
  '/:id',
  authenticate,
  authorize('contacts', 'delete'),
  ContactController.deleteContact
);



module.exports = router;
