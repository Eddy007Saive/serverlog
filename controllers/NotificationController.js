const notificationService = require('../services/notificationService');
const userService = require('../services/userService');

/**
 * Créer une nouvelle notification
 * @route POST /api/notifications
 */
exports.createNotification = async (req, res) => {
  try {
    console.log("body", req.body);
    const notification = await notificationService.createNotification(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la création de la notification');
  }
};

/**
 * Créer plusieurs notifications en batch
 * @route POST /api/notifications/batch
 */
exports.createMultipleNotifications = async (req, res) => {
  try {
    const { notifications } = req.body;
    
    if (!Array.isArray(notifications)) {
      return res.status(400).json({
        success: false,
        error: 'Un tableau de notifications est requis'
      });
    }

    const createdNotifications = await notificationService.createMultipleNotifications(notifications);
    
    res.status(201).json({
      success: true,
      data: createdNotifications,
      count: createdNotifications.length
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la création multiple de notifications');
  }
};

/**
 * Récupérer toutes les notifications avec pagination et filtres
 * @route GET /api/notifications
 * @query page - Numéro de page (défaut: 1)
 * @query limit - Nombre d'éléments par page (défaut: 20)
 * @query search - Recherche dans message et workflow
 * @query statusFilter - Filtre par statut (success, warning, error, info)
 * @query workflowFilter - Filtre par workflow
 * @query readFilter - Filtre par statut de lecture (read, unread)
 * @query sortBy - Champ de tri (défaut: created_at)
 * @query sortOrder - Ordre de tri (asc/desc, défaut: desc)
 */
exports.getNotifications = async (req, res) => {
  try {
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      search: req.query.search || '',
      statusFilter: req.query.statusFilter || '',
      workflowFilter: req.query.workflowFilter || '',
      readFilter: req.query.readFilter || '',
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await notificationService.getAllNotifications(options);

    res.status(200).json({
      success: true,
      ...result  // Contient data et pagination
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des notifications');
  }
};

/**
 * Récupérer les notifications d'un utilisateur avec pagination
 * @route GET /api/notifications/user
 * @query page - Numéro de page (défaut: 1)
 * @query limit - Nombre d'éléments par page (défaut: 20)
 * @query search - Recherche
 * @query statusFilter - Filtre par statut
 * @query workflowFilter - Filtre par workflow
 * @query readFilter - Filtre par statut de lecture
 * @query sortBy - Champ de tri
 * @query sortOrder - Ordre de tri (asc/desc)
 */
exports.getNotificationsByUser = async (req, res) => {
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
      search: req.query.search || '',
      statusFilter: req.query.statusFilter || '',
      workflowFilter: req.query.workflowFilter || '',
      readFilter: req.query.readFilter || '',
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await notificationService.getNotificationsByUser(user.userId, options);

    res.status(200).json({
      success: true,
      ...result  // Contient data et pagination
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des notifications de l\'utilisateur');
  }
};

/**
 * Récupérer une notification par ID
 * @route GET /api/notifications/:id
 */
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await notificationService.getNotificationById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification non trouvée'
      });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération de la notification');
  }
};

/**
 * Mettre à jour une notification
 * @route PATCH /api/notifications/:id
 */
exports.updateNotification = async (req, res) => {
  try {
    const notification = await notificationService.updateNotification(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Notification mise à jour avec succès',
      data: notification
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la mise à jour de la notification');
  }
};

/**
 * Marquer une notification comme lue
 * @route PATCH /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Notification marquée comme lue',
      data: notification
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors du marquage comme lu');
  }
};

/**
 * Marquer une notification comme non lue
 * @route PATCH /api/notifications/:id/unread
 */
exports.markAsUnread = async (req, res) => {
  try {
    const notification = await notificationService.markAsUnread(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Notification marquée comme non lue',
      data: notification
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors du marquage comme non lu');
  }
};

/**
 * Marquer plusieurs notifications comme lues
 * @route PATCH /api/notifications/batch/read
 * @body ids - Tableau d'IDs de notifications
 */
exports.markMultipleAsRead = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Un tableau d\'IDs est requis'
      });
    }

    const result = await notificationService.markMultipleAsRead(ids);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors du marquage multiple comme lu');
  }
};

/**
 * Marquer plusieurs notifications comme non lues
 * @route PATCH /api/notifications/batch/unread
 * @body ids - Tableau d'IDs de notifications
 */
exports.markMultipleAsUnread = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Un tableau d\'IDs est requis'
      });
    }

    const result = await notificationService.markMultipleAsUnread(ids);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors du marquage multiple comme non lu');
  }
};

/**
 * Marquer toutes les notifications comme lues
 * @route PATCH /api/notifications/all/read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead();
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors du marquage global comme lu');
  }
};

/**
 * Supprimer une notification
 * @route DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Notification supprimée avec succès'
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la suppression de la notification');
  }
};

/**
 * Supprimer plusieurs notifications
 * @route DELETE /api/notifications/batch
 * @body ids - Tableau d'IDs de notifications
 */
exports.deleteMultipleNotifications = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Un tableau d\'IDs est requis'
      });
    }

    const result = await notificationService.deleteMultipleNotifications(ids);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la suppression multiple');
  }
};

/**
 * Obtenir le nombre de notifications non lues
 * @route GET /api/notifications/unread/count
 * @query userId - ID utilisateur (optionnel, sinon toutes les notifications)
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const count = await notificationService.getUnreadCount(userId);
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors du comptage des notifications non lues');
  }
};

/**
 * Obtenir le nombre de notifications non lues pour l'utilisateur connecté
 * @route GET /api/notifications/user/unread/count
 */
exports.getUserUnreadCount = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const count = await notificationService.getUnreadCount(user.userId);
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors du comptage des notifications non lues');
  }
};

/**
 * Nettoyer les anciennes notifications
 * @route DELETE /api/notifications/clean
 * @query daysOld - Nombre de jours (défaut: 30)
 */
exports.cleanOldNotifications = async (req, res) => {
  try {
    const daysOld = parseInt(req.query.daysOld) || 30;
    const result = await notificationService.cleanOldNotifications(daysOld);
    
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors du nettoyage des anciennes notifications');
  }
};

/**
 * Obtenir des statistiques sur les notifications
 * @route GET /api/notifications/stats
 * @query userId - ID utilisateur (optionnel)
 */
exports.getNotificationsStats = async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const stats = await notificationService.getNotificationsStats(userId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des statistiques');
  }
};

/**
 * Obtenir des statistiques pour l'utilisateur connecté
 * @route GET /api/notifications/user/stats
 */
exports.getUserNotificationsStats = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const stats = await notificationService.getNotificationsStats(user.userId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la récupération des statistiques');
  }
};

/**
 * Rechercher des notifications avec pagination
 * @route POST /api/notifications/search
 */
exports.searchNotifications = async (req, res) => {
  try {
    const options = {
      page: req.body.page || req.query.page || 1,
      limit: req.body.limit || req.query.limit || 20,
      search: req.body.search || '',
      statusFilter: req.body.statusFilter || '',
      workflowFilter: req.body.workflowFilter || '',
      readFilter: req.body.readFilter || '',
      sortBy: req.body.sortBy || 'created_at',
      sortOrder: req.body.sortOrder || 'desc'
    };

    const result = await notificationService.searchNotifications(options);
    
    res.status(200).json({
      success: true,
      ...result  // Contient data et pagination
    });
  } catch (err) {
    handleError(res, err, 'Erreur lors de la recherche de notifications');
  }
};

/**
 * Gestionnaire d'erreurs centralisé
 * @private
 */
function handleError(res, err, defaultMessage) {
  console.error(`[NotificationController] ${defaultMessage}:`, err);

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