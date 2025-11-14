const configurationService = require('../services/configurationService');
const userService = require('../services/userService');

/**
 * Récupérer la configuration de l'utilisateur connecté
 * @route GET /api/configuration
 */
exports.getConfiguration = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const configuration = await configurationService.getConfiguration(user.userId);

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Aucune configuration trouvée',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: configuration.toSafeJSON() // Version sans données sensibles
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération de la configuration');
  }
};

/**
 * Créer une nouvelle configuration
 * @route POST /api/configuration
 */
exports.createConfiguration = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si une configuration existe déjà
    const existingConfig = await configurationService.getConfiguration(user.userId);
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        error: 'Une configuration existe déjà pour cet utilisateur'
      });
    }

    const configuration = await configurationService.createConfiguration(req.body, user.userId);

    res.status(201).json({
      success: true,
      message: 'Configuration créée avec succès',
      data: configuration.toSafeJSON()
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la création de la configuration');
  }
};

/**
 * Mettre à jour ou créer la configuration (Upsert)
 * @route PUT /api/configuration
 */
exports.upsertConfiguration = async (req, res) => {
  try {
    
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const configuration = await configurationService.upsertConfiguration(req.body, user.id);

    res.status(200).json({
      success: true,
      message: 'Configuration mise à jour avec succès',
      data: configuration.toSafeJSON()
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la mise à jour de la configuration');
  }
};

/**
 * Mettre à jour la configuration existante
 * @route PATCH /api/configuration/:id
 */
exports.updateConfiguration = async (req, res) => {
  try {
    const configuration = await configurationService.updateConfiguration(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Configuration mise à jour avec succès',
      data: configuration.toSafeJSON()
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la mise à jour de la configuration');
  }
};

/**
 * Valider la configuration de l'utilisateur connecté
 * @route GET /api/configuration/validate
 */
exports.validateConfiguration = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const validation = await configurationService.validateConfiguration(user.userId);

    res.status(200).json(validation);
  } catch (err) {
    handleError(res, err, 'Erreur lors de la validation de la configuration');
  }
};

/**
 * Supprimer la configuration
 * @route DELETE /api/configuration/:id
 */
exports.deleteConfiguration = async (req, res) => {
  try {
    await configurationService.deleteConfiguration(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Configuration supprimée avec succès'
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la suppression de la configuration');
  }
};

// ========== GESTION QUOTAS ==========

/**
 * Récupérer le quota de l'utilisateur connecté
 * @route GET /api/configuration/quota
 */
exports.getQuota = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const quota = await configurationService.getQuota(user.userId);

    if (!quota) {
      return res.status(404).json({
        success: false,
        message: 'Aucun quota trouvé',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: quota
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération du quota');
  }
};

/**
 * Créer un quota pour l'utilisateur
 * @route POST /api/configuration/quota
 */
exports.createQuota = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const { quotaRestant } = req.body;
    const quota = await configurationService.createQuota(
      user.userId,
      quotaRestant || 50
    );

    res.status(201).json({
      success: true,
      message: 'Quota créé avec succès',
      data: quota
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la création du quota');
  }
};

/**
 * Mettre à jour le quota de l'utilisateur
 * @route PATCH /api/configuration/quota
 */
exports.updateQuota = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const quota = await configurationService.updateQuota(user.userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Quota mis à jour avec succès',
      data: quota
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la mise à jour du quota');
  }
};

/**
 * Décrémenter le quota de l'utilisateur
 * @route POST /api/configuration/quota/decrement
 */
exports.decrementQuota = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const { amount } = req.body;
    const quota = await configurationService.decrementQuota(
      user.userId,
      amount || 1
    );

    res.status(200).json({
      success: true,
      message: 'Quota décrémenté avec succès',
      data: quota
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la décrémentation du quota');
  }
};

/**
 * Réinitialiser le quota quotidien de l'utilisateur
 * @route POST /api/configuration/quota/reset
 */
exports.resetDailyQuota = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const { newQuota } = req.body;
    const quota = await configurationService.resetDailyQuota(
      user.userId,
      newQuota || 50
    );

    res.status(200).json({
      success: true,
      message: 'Quota réinitialisé avec succès',
      data: quota
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la réinitialisation du quota');
  }
};

// ========== FONCTIONS UTILITAIRES ==========

/**
 * Vérifier si l'utilisateur peut lancer une campagne
 * @route GET /api/configuration/can-launch-campaign
 */
exports.canLaunchCampaign = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const result = await configurationService.canLaunchCampaign(user.userId);

    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, 'Erreur lors de la vérification des prérequis');
  }
};

/**
 * Obtenir le statut complet du système pour l'utilisateur
 * @route GET /api/configuration/system-status
 */
exports.getSystemStatus = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const status = await configurationService.getSystemStatus(user.userId);
    

    // Masquer les données sensibles dans la configuration
    if (status.data && status.data.configuration) {
      const config = status.data.configuration;
      status.data.configuration = {
        id: config.id,
        nom: config.nom,
        valeur: config.valeur,
        email: config.email,
        status: config.status,
        derniereMiseAJour: config.derniereMiseAJour,
        cookieValid: config.isValidCookie ? config.isValidCookie() : false,
        userAgentValid: config.userAgent && config.userAgent.length > 50
      };
    }
    res.status(200).json(status);
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération du statut système');
  }
};

/**
 * Activer la configuration
 * @route POST /api/configuration/:id/activate
 */
exports.activateConfiguration = async (req, res) => {
  try {
    const configuration = await configurationService.getConfigurationById(req.params.id);

    if (!configuration) {
      return res.status(404).json({
        success: false,
        error: 'Configuration non trouvée'
      });
    }

    configuration.activate();
    const updated = await configurationService.updateConfiguration(
      req.params.id,
      configuration
    );

    res.status(200).json({
      success: true,
      message: 'Configuration activée avec succès',
      data: updated.toSafeJSON()
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de l\'activation de la configuration');
  }
};

/**
 * Désactiver la configuration
 * @route POST /api/configuration/:id/deactivate
 */
exports.deactivateConfiguration = async (req, res) => {
  try {
    const configuration = await configurationService.getConfigurationById(req.params.id);

    if (!configuration) {
      return res.status(404).json({
        success: false,
        error: 'Configuration non trouvée'
      });
    }

    configuration.deactivate();
    const updated = await configurationService.updateConfiguration(
      req.params.id,
      configuration
    );

    res.status(200).json({
      success: true,
      message: 'Configuration désactivée avec succès',
      data: updated.toSafeJSON()
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la désactivation de la configuration');
  }
};

/**
 * Obtenir le statut de validation détaillé
 * @route GET /api/configuration/:id/validation-status
 */
exports.getValidationStatus = async (req, res) => {
  try {
    const configuration = await configurationService.getConfigurationById(req.params.id);

    if (!configuration) {
      return res.status(404).json({
        success: false,
        error: 'Configuration non trouvée'
      });
    }

    const validationStatus = configuration.getValidationStatus();

    res.status(200).json({
      success: true,
      data: validationStatus
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération du statut de validation');
  }
};

/**
 * Gestionnaire d'erreurs centralisé
 * @private
 */
function handleError(res, err, defaultMessage) {
  console.error(`[ConfigurationController] ${defaultMessage}:`, err);

  // Erreur de validation
  if (err.validationErrors) {
    return res.status(400).json({
      success: false,
      errors: err.validationErrors
    });
  }

  // Erreur avec message spécifique
  if (err.message && err.message.includes('Validation échouée')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // Erreur 404
  if (err.statusCode === 404 || err.message?.includes('non trouvé')) {
    return res.status(404).json({
      success: false,
      error: err.message || 'Ressource non trouvée'
    });
  }

  // Erreur avec code HTTP défini
  const statusCode = err.statusCode || 500;
  const message = err.message || defaultMessage;

  res.status(statusCode).json({
    success: false,
    error: message
  });
}