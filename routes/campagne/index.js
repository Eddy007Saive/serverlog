// routes/campagnes.js
const express = require('express');
const router = express.Router();
const campagneController = require('../../controllers/CampagneController');
const { authenticate, authorize } = require('../../middleware/auth');

// Créer une campagne
router.post(
  '/',
  authenticate,
  authorize('campagnes', 'write'),
  campagneController.createCampagne
);

// Récupérer toutes les campagnes de l'utilisateur (ou toutes si admin)
router.get(
  '/',
  authenticate,
  authorize('campagnes', 'read'),
  campagneController.getCampagnes
);

router.get(
  '/user',
  authenticate,
  authorize('campagnes', 'read'),
  campagneController.getCampagnesByUser
);

// Statistiques des campagnes
router.get(
  '/stats',
  authenticate,
  authorize('campagnes', 'read'),
  campagneController.getCampagneStats
);

// Recherche de campagnes
router.post(
  '/search',
  authenticate,
  authorize('campagnes', 'read'),
  campagneController.searchCampagnes
);

// Récupérer une campagne par ID
router.get(
  '/:id',
  authenticate,
  authorize('campagnes', 'read'),
  campagneController.getCampagneById
);

// Mettre à jour une campagne
router.patch(
  '/:id',
  authenticate,
  authorize('campagnes', 'write'),
  campagneController.updateCampagne
);

// Supprimer une campagne
router.delete(
  '/:id',
  authenticate,
  authorize('campagnes', 'delete'),
  campagneController.deleteCampagne
);

// Lancer une campagne
router.post(
  '/:id/lancer',
  authenticate,
  authorize('campagnes', 'write'),
  campagneController.lancerCampagne
);

module.exports = router;
