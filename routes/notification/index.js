// routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/NotificationController');
const { authenticate, authorize } = require('../../middleware/auth');

// ==================== Routes de statistiques ====================
// (Doivent être avant les routes avec :id pour éviter les conflits)

// Statistiques globales des notifications
router.get(
  '/stats',
  authenticate,
  authorize('notifications', 'read'),
  notificationController.getNotificationsStats
);

// Statistiques des notifications de l'utilisateur
router.get(
  '/user/stats',
  authenticate,
  authorize('notifications', 'read'),
  notificationController.getUserNotificationsStats
);

// Compteur de notifications non lues (global)
router.get(
  '/unread/count',
  authenticate,
  authorize('notifications', 'read'),
  notificationController.getUserUnreadCount
);

// Compteur de notifications non lues pour l'utilisateur
router.get(
  '/user/unread/count',
  authenticate,
  authorize('notifications', 'read'),
  notificationController.getUserUnreadCount
);

// ==================== Routes utilisateur ====================

// Récupérer toutes les notifications de l'utilisateur
router.get(
  '/user',
  authenticate,
  authorize('notifications', 'read'),
  notificationController.getNotificationsByUser
);

// ==================== Routes de recherche ====================

// Recherche de notifications
router.post(
  '/search',
  authenticate,
  authorize('notifications', 'read'),
  notificationController.searchNotifications
);

// ==================== Routes batch ====================

// Créer plusieurs notifications
router.post(
  '/batch',
  authenticate,
  authorize('notifications', 'write'),
  notificationController.createMultipleNotifications
);

// Marquer plusieurs notifications comme lues
router.patch(
  '/batch/read',
  authenticate,
  authorize('notifications', 'write'),
  notificationController.markMultipleAsRead
);

// Marquer plusieurs notifications comme non lues
router.patch(
  '/batch/unread',
  authenticate,
  authorize('notifications', 'write'),
  notificationController.markMultipleAsUnread
);

// Supprimer plusieurs notifications
router.delete(
  '/batch',
  authenticate,
  authorize('notifications', 'delete'),
  notificationController.deleteMultipleNotifications
);

// ==================== Routes globales ====================

// Marquer toutes les notifications comme lues
router.patch(
  '/all/read',
  authenticate,
  authorize('notifications', 'write'),
  notificationController.markAllAsRead
);

// Nettoyer les anciennes notifications
router.delete(
  '/clean',
  authenticate,
  authorize('notifications', 'delete'),
  notificationController.cleanOldNotifications
);

// ==================== Routes CRUD de base ====================

// Créer une notification
router.post(
  '/',
  authenticate,
  authorize('notifications', 'write'),
  notificationController.createNotification
);

// Récupérer toutes les notifications (avec pagination et filtres)
router.get(
  '/',
  authenticate,
  authorize('notifications', 'read'),
  notificationController.getNotifications
);

// ==================== Routes avec :id ====================
// (Doivent être à la fin pour éviter les conflits)

// Marquer une notification comme lue
router.patch(
  '/:id/read',
  authenticate,
  authorize('notifications', 'write'),
  notificationController.markAsRead
);

// Marquer une notification comme non lue
router.patch(
  '/:id/unread',
  authenticate,
  authorize('notifications', 'write'),
  notificationController.markAsUnread
);

// Récupérer une notification par ID
router.get(
  '/:id',
  authenticate,
  authorize('notifications', 'read'),
  notificationController.getNotificationById
);

// Mettre à jour une notification
router.patch(
  '/:id',
  authenticate,
  authorize('notifications', 'write'),
  notificationController.updateNotification
);

// Supprimer une notification
router.delete(
  '/:id',
  authenticate,
  authorize('notifications', 'delete'),
  notificationController.deleteNotification
);

module.exports = router;