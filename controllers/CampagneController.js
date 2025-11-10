const campagneService = require('../services/campagneService');
const userService = require('../services/userService');

/**
 * Créer une nouvelle campagne
 * @route POST /api/campagnes
 */
exports.createCampagne = async (req, res) => {
  try {
    const campagne = await campagneService.createCampagne(req.body);
    res.status(201).json({ success: true, data: campagne });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la création de la campagne');
  }
};

/**
 * Récupérer toutes les campagnes
 * @route GET /api/campagnes
 */
exports.getCampagnes = async (req, res) => {
  try {
    const campagnes = await campagneService.getAllCampagnes(req.query);
    res.status(200).json({ success: true, data: campagnes });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des campagnes');
  }
};

exports.getCampagnesByUser = async (req, res) => {
  try {
    const user=await userService.findById(req.user.id);
    console.log("user",user);
    const campagnes = await campagneService.getAllCampagnesByUser(user.userId, req.query);
    res.status(200).json({ success: true, data: campagnes });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des campagnes');
  }
};

/**
 * Récupérer une campagne par ID
 * @route GET /api/campagnes/:id
 */
exports.getCampagneById = async (req, res) => {
  try {
    const campagne = await campagneService.getCampagneById(req.params.id);
    res.status(200).json({ success: true, data: campagne });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération de la campagne');
  }
};

/**
 * Mettre à jour une campagne
 * @route PATCH /api/campagnes/:id
 */
exports.updateCampagne = async (req, res) => {
  try {
    const campagne = await campagneService.updateCampagne(req.params.id, req.body);
    res.status(200).json({ success: true, data: campagne });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la mise à jour de la campagne');
  }
};

/**
 * Supprimer une campagne
 * @route DELETE /api/campagnes/:id
 */
exports.deleteCampagne = async (req, res) => {
  try {
    await campagneService.deleteCampagne(req.params.id);
    res.status(200).json({ 
      success: true, 
      message: 'Campagne supprimée avec succès' 
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la suppression de la campagne');
  }
};

/**
 * Lancer une campagne via webhook
 * @route POST /api/campagnes/:id/lancer
 */
exports.lancerCampagne = async (req, res) => {
  try {
    const result = await campagneService.lancerCampagne(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, 'Erreur lors du lancement de la campagne');
  }
};

/**
 * Rechercher des campagnes
 * @route POST /api/campagnes/search
 */
exports.searchCampagnes = async (req, res) => {
  try {
    const campagnes = await campagneService.searchCampagnes(req.body);
    res.status(200).json({ success: true, data: campagnes });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la recherche de campagnes');
  }
};

/**
 * Obtenir des statistiques sur les campagnes
 * @route GET /api/campagnes/stats
 */
exports.getCampagneStats = async (req, res) => {
  try {
    const stats = await campagneService.getCampagneStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des statistiques');
  }
};

/**
 * Gestionnaire d'erreurs centralisé
 * @private
 */
function handleError(res, err, defaultMessage) {
  console.error(`[CampagneController] ${defaultMessage}:`, err);

  // Erreur de validation
  if (err.validationErrors) {
    return res.status(400).json({ 
      success: false, 
      errors: err.validationErrors 
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