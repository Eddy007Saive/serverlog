const campagneService = require('../services/campagneService');
const userService = require('../services/userService');

/**
 * Créer une nouvelle campagne
 * @route POST /api/campagnes
 */
exports.createCampagne = async (req, res) => {
  try {
    console.log("body",req.body);
    const campagne = await campagneService.createCampagne(req.body);
    res.status(201).json({ success: true, data: campagne });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la création de la campagne');
  }
};

/**
 * Récupérer toutes les campagnes avec pagination
 * @route GET /api/campagnes
 * @query page - Numéro de page (défaut: 1)
 * @query limit - Nombre d'éléments par page (défaut: 20)
 * @query sortBy - Champ de tri
 * @query sortOrder - Ordre de tri (asc/desc)
 */
exports.getCampagnes = async (req, res) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      filterByFormula: req.query.filter || '',
      sort: req.query.sortBy ? [{
        field: req.query.sortBy,
        direction: req.query.sortOrder || 'asc'
      }] : []
    };

    const result = await campagneService.getAllCampagnes(options);

    res.status(200).json({
      success: true,
      ...result  // Contient data et pagination
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des campagnes');
  }
};

/**
 * Récupérer les campagnes d'un utilisateur avec pagination
 * @route GET /api/campagnes/user
 * @query page - Numéro de page (défaut: 1)
 * @query limit - Nombre d'éléments par page (défaut: 20)
 * @query sortBy - Champ de tri
 * @query sortOrder - Ordre de tri (asc/desc)
 */
exports.getCampagnesByUser = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      ...(req.query.sortBy && {
        sort: [{
          field: req.query.sortBy,
          direction: req.query.sortOrder || 'asc'
        }]
      })
    };

    const result = await campagneService.getAllCampagnesByUser(user.userId, options);
    

    res.status(200).json({
      success: true,
      result  
    });
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
    

    if (!campagne) {
      return res.status(404).json({
        success: false,
        error: 'Campagne non trouvée'
      });
    }

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
    res.status(200).json({ success: true, message:"Campagne mise à jour avec succès"  });
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
 * Rechercher des campagnes avec pagination
 * @route POST /api/campagnes/search
 */
exports.searchCampagnes = async (req, res) => {
  try {
    const options = {
      page: req.body.page || req.query.page || 1,
      limit: req.body.limit || req.query.limit || 20,
      ...req.body
    };

    const result = await campagneService.searchCampagnes(options);
    res.status(200).json({
      success: true,
      ...result  // Contient data et pagination
    });
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