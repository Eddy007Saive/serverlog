const express = require('express');
const router = express.Router();
const ConfigurationController = require('../../controllers/ConfigurationController');
const { authenticate, authorize } = require('../../middleware/auth');

/**
 * Récupérer la configuration de l'utilisateur courant
 * @route GET /api/configuration
 */
router.get(
  '/',
  authenticate,
  authorize('configurations', 'read'),
  ConfigurationController.getConfiguration
);

/**
 * Créer une nouvelle configuration
 * @route POST /api/configuration
 */
router.post(
  '/',
  authenticate,
  authorize('configurations', 'write'),
  ConfigurationController.createConfiguration
);

/**
 * Mettre à jour ou créer une configuration (upsert)
 * @route PUT /api/configuration
 */
router.put(
  '/',
  authenticate,
  authorize('configurations', 'write'),
  ConfigurationController.upsertConfiguration
);

/**
 * Mettre à jour partiellement une configuration
 * @route PATCH /api/configuration/:id
 */
router.patch(
  '/:id',
  authenticate,
  authorize('configurations', 'write'),
  ConfigurationController.updateConfiguration
);

/**
 * Supprimer une configuration
 * @route DELETE /api/configuration/:id
 */
router.delete(
  '/:id',
  authenticate,
  authorize('configurations', 'delete'),
  ConfigurationController.deleteConfiguration
);

/**
 * Valider une configuration
 * @route GET /api/configuration/validate
 */
router.get(
  '/validate',
  authenticate,
  authorize('configurations', 'read'),
  ConfigurationController.validateConfiguration
);

/**
 * Activer une configuration
 * @route POST /api/configuration/:id/activate
 */
router.post(
  '/:id/activate',
  authenticate,
  authorize('configurations', 'write'),
  ConfigurationController.activateConfiguration
);

/**
 * Désactiver une configuration
 * @route POST /api/configuration/:id/deactivate
 */
router.post(
  '/:id/deactivate',
  authenticate,
  authorize('configurations', 'write'),
  ConfigurationController.deactivateConfiguration
);

/**
 * Obtenir le statut de validation détaillé
 * @route GET /api/configuration/:id/validation-status
 */
router.get(
  '/:id/validation-status',
  authenticate,
  authorize('configurations', 'read'),
  ConfigurationController.getValidationStatus
);

/**
 * =========================
 * QUOTA
 * =========================
 */

/**
 * Récupérer le quota
 * @route GET /api/configuration/quota
 */
router.get(
  '/quota',
  authenticate,
  authorize('configurations', 'read'),
  ConfigurationController.getQuota
);

/**
 * Créer un quota
 * @route POST /api/configuration/quota
 */
router.post(
  '/quota',
  authenticate,
  authorize('configurations', 'write'),
  ConfigurationController.createQuota
);

/**
 * Mettre à jour le quota
 * @route PATCH /api/configuration/quota
 */
router.patch(
  '/quota',
  authenticate,
  authorize('configurations', 'write'),
  ConfigurationController.updateQuota
);

/**
 * Décrémenter le quota
 * @route POST /api/configuration/quota/decrement
 */
router.post(
  '/quota/decrement',
  authenticate,
  authorize('configurations', 'write'),
  ConfigurationController.decrementQuota
);

/**
 * Réinitialiser le quota
 * @route POST /api/configuration/quota/reset
 */
router.post(
  '/quota/reset',
  authenticate,
  authorize('configurations', 'write'),
  ConfigurationController.resetDailyQuota
);

/**
 * =========================
 * UTILITAIRES
 * =========================
 */

/**
 * Vérifier si l'utilisateur peut lancer une campagne
 * @route GET /api/configuration/can-launch-campaign
 */
router.get(
  '/can-launch-campaign',
  authenticate,
  authorize('configurations', 'read'),
  ConfigurationController.canLaunchCampaign
);

/**
 * Récupérer le statut complet du système
 * @route GET /api/configuration/system-status
 */
router.get(
  '/system-status',
  authenticate,
  authorize('configurations', 'read'),
  ConfigurationController.getSystemStatus
);

module.exports = router;
