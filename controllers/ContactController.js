const { User } = require('../middleware/auth');
const contactService = require('../services/contactService');
const userService = require('../services/userService');

/**
 * Créer un nouveau contact
 * @route POST /api/contacts
 */
exports.createContact = async (req, res) => {
  try {
    const contact = await contactService.createContact(req.body);
    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la création du contact');
  }
};

/**
 * Créer plusieurs contacts en batch
 * @route POST /api/contacts/batch
 */
exports.createMultipleContacts = async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Un tableau de contacts est requis'
      });
    }

    const createdContacts = await contactService.createMultipleContacts(contacts);
    
    res.status(201).json({
      success: true,
      data: createdContacts,
      message: `${createdContacts.length} contact(s) créé(s) avec succès`
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la création multiple de contacts');
  }
};

/**
 * Récupérer tous les contacts avec pagination
 * @route GET /api/contacts
 * @query page - Numéro de page (défaut: 1)
 * @query limit - Nombre d'éléments par page (défaut: 20)
 * @query sortBy - Champ de tri
 * @query sortOrder - Ordre de tri (asc/desc)
 */
exports.getContacts = async (req, res) => {
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

    const result = await contactService.getAllContacts(options);
    console.log(result);
    

    res.status(200).json({
      success: true,
      ...result  // Contient data et pagination
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des contacts');
  }
};

/**
 * Récupérer les contacts d'un utilisateur avec pagination
 * @route GET /api/contacts/user
 * @query page - Numéro de page (défaut: 1)
 * @query limit - Nombre d'éléments par page (défaut: 20)
 * @query sortBy - Champ de tri
 * @query sortOrder - Ordre de tri (asc/desc)
 */
/**
 * Récupérer les contacts d'un utilisateur avec pagination
 * @route GET /api/contacts/user
 */
exports.getContactsByUser = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || '',
      statusFilter: req.query.statusFilter || '',
      profileFilter: req.query.profileFilter || '',
      ...(req.query.sortBy && {
        sort: [{
          field: req.query.sortBy,
          direction: req.query.sortOrder || 'asc'
        }]
      })
    };

    const result = await contactService.getAllContactsByUser(user.userId, options);
    
    res.status(200).json({
      success: true,
      result
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des contacts de l\'utilisateur');
  }
};
/**
 * Récupérer les contacts d'une campagne
 * @route GET /api/contacts/campagne/:campagneId
 * @query page - Numéro de page (défaut: 1)
 * @query limit - Nombre d'éléments par page (défaut: 20)
 * @query search - Terme de recherche
 * @query statusFilter - Filtre par statut
 * @query profileFilter - Filtre par profil
 */
exports.getContactsByCampagne = async (req, res) => {
  try {
    const campagneId  = req.params.id;


    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      search: req.query.search || '',
      statusFilter: req.query.statusFilter || '',
      profileFilter: req.query.profileFilter || '',
      userId: req.user?.id || null,
      sort: req.query.sortBy ? [{
        field: req.query.sortBy,
        direction: req.query.sortOrder || 'asc'
      }] : []
    };

    const result = await contactService.getContactsByCampagne(campagneId, options);
    console.log(result);
    

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des contacts de la campagne');
  }
};

/**
 * Récupérer un contact par ID
 * @route GET /api/contacts/:id
 */
exports.getContactById = async (req, res) => {
  try {
    const contact = await contactService.getContactById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact non trouvé'
      });
    }

    res.status(200).json({ success: true, data: contact });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération du contact');
  }
};

/**
 * Mettre à jour un contact
 * @route PATCH /api/contacts/:id
 */
exports.updateContact = async (req, res) => {
  try {
    const contact = await contactService.updateContact(req.params.id, req.body);
    res.status(200).json({ success: true, data: contact });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la mise à jour du contact');
  }
};

/**
 * Mettre à jour le statut d'un contact
 * @route PATCH /api/contacts/:id/status
 */
exports.updateContactStatus = async (req, res) => {
  try {
    const { statut } = req.body;

    if (!statut) {
      return res.status(400).json({
        success: false,
        error: 'Le statut est requis'
      });
    }

    const contact = await contactService.updateContactStatus(req.params.id, statut);
    
    res.status(200).json({
      success: true,
      data: contact,
      message: 'Statut mis à jour avec succès'
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la mise à jour du statut');
  }
};

/**
 * Mettre à jour le profil d'un contact
 * @route PATCH /api/contacts/:id/profile
 */
exports.updateContactProfile = async (req, res) => {
  try {
    const { profil } = req.body;

    if (!profil) {
      return res.status(400).json({
        success: false,
        error: 'Le profil est requis'
      });
    }

    const validProfiles = ['GARDE', 'REJETE', 'En attente'];
    if (!validProfiles.includes(profil)) {
      return res.status(400).json({
        success: false,
        error: `Profil invalide. Valeurs acceptées: ${validProfiles.join(', ')}`
      });
    }

    const contact = await contactService.updateContactProfile(req.params.id, profil);
    
    res.status(200).json({
      success: true,
      data: contact,
      message: 'Profil mis à jour avec succès'
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la mise à jour du profil');
  }
};

/**
 * Supprimer un contact
 * @route DELETE /api/contacts/:id
 */
exports.deleteContact = async (req, res) => {
  try {
    await contactService.deleteContact(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Contact supprimé avec succès'
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la suppression du contact');
  }
};

/**
 * Trier automatiquement les profils d'une campagne
 * @route POST /api/contacts/campagne/:campagneId/auto-sort
 */
exports.autoSortProfiles = async (req, res) => {
  try {
    const { campagneId } = req.params;
    const result = await contactService.autoSortProfiles(campagneId);
    
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, 'Erreur lors du tri automatique des profils');
  }
};

/**
 * Retrier manuellement les profils d'une campagne
 * @route POST /api/contacts/campagne/:campagneId/manual-sort
 */
exports.manualSortProfiles = async (req, res) => {
  try {
    const { campagneId } = req.params;
    const result = await contactService.manualSortProfiles(campagneId);
    
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err, 'Erreur lors du retri manuel des profils');
  }
};

/**
 * Rechercher des contacts avec pagination
 * @route POST /api/contacts/search
 * @body search - Terme de recherche
 * @body statut - Filtre par statut
 * @body profil - Filtre par profil
 * @body campagne - Filtre par campagne
 * @body page - Numéro de page
 * @body limit - Nombre d'éléments par page
 */
exports.searchContacts = async (req, res) => {
  try {
    const criteria = {
      search: req.body.search || '',
      statut: req.body.statut || '',
      profil: req.body.profil || '',
      campagne: req.body.campagne || '',
      page: req.body.page || req.query.page || 1,
      limit: req.body.limit || req.query.limit || 20,
      sortBy: req.body.sortBy || req.query.sortBy || '',
      sortOrder: req.body.sortOrder || req.query.sortOrder || 'asc'
    };

    const result = await contactService.searchContacts(criteria);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la recherche de contacts');
  }
};

/**
 * Obtenir des statistiques sur les contacts
 * @route GET /api/contacts/stats
 * @query userId - ID utilisateur (optionnel)
 */
exports.getContactsStats = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || null;
    
    const user=await User.findById(userId)

    const stats = await contactService.getContactsStats(user.userId);
    
    res.status(200).json({ 
      success: true, 
      data: stats 
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des statistiques');
  }
};

/**
 * Obtenir des statistiques par campagne
 * @route GET /api/contacts/stats/campagne/:campagneId
 */
exports.getContactsStatsByCampagne = async (req, res) => {
  try {
    const { campagneId } = req.params;
    
    // Récupérer tous les contacts de la campagne
    const result = await contactService.getContactsByCampagne(campagneId, { 
      limit: 1000,
      userId: req.user?.id || null 
    });
    
    const contacts = result.data;

    // Calculer les statistiques
    const stats = {
      total: contacts.length,
      byStatus: {},
      byProfile: {},
      nonContacte: 0,
      messageEnvoye: 0,
      reponseRecue: 0,
      interesse: 0,
      nonInteresse: 0,
      aRelancer: 0,
      profilsGardes: 0,
      profilsRejetes: 0,
      profilsEnAttente: 0
    };

    contacts.forEach(contact => {
      const statut = contact.statut || 'À contacter';
      const profil = contact.profil || 'En attente';

      // Stats par statut
      stats.byStatus[statut] = (stats.byStatus[statut] || 0) + 1;

      switch (statut) {
        case 'À contacter':
          stats.nonContacte++;
          break;
        case 'Message envoyé':
          stats.messageEnvoye++;
          break;
        case 'Répondu':
          stats.reponseRecue++;
          break;
        case 'Intéressé':
          stats.interesse++;
          break;
        case 'Non intéressé':
          stats.nonInteresse++;
          break;
        case 'À relancer':
          stats.aRelancer++;
          break;
      }

      // Stats par profil
      stats.byProfile[profil] = (stats.byProfile[profil] || 0) + 1;

      switch (profil) {
        case 'GARDE':
          stats.profilsGardes++;
          break;
        case 'REJETE':
          stats.profilsRejetes++;
          break;
        case 'En attente':
        default:
          stats.profilsEnAttente++;
          break;
      }
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des statistiques de la campagne');
  }
};

/**
 * Gestionnaire d'erreurs centralisé
 * @private
 */
function handleError(res, err, defaultMessage) {
  console.error(`[ContactController] ${defaultMessage}:`, err);

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