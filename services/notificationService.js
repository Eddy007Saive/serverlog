const { base } = require('../config/airtable');
const Notification = require('../models/Notification');

const AIRTABLE_TABLE_NAME = 'Notification';

const notificationService = {
  /**
   * Créer une nouvelle notification
   * @param {Object} data - Données de la notification
   * @returns {Promise<Notification>}
   */
  async createNotification(data) {
    const notification = new Notification(data);

    const validationErrors = notification.validate();
    if (validationErrors) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }

    const fields = notification.toAirtableFields();
    console.log('Fields to create:', JSON.stringify(fields, null, 2));

    const records = await base(AIRTABLE_TABLE_NAME).create([
      { fields }
    ]);

    return Notification.fromAirtableRecord(records[0]);
  },

  /**
   * Créer plusieurs notifications en batch
   * @param {Array<Object>} notificationsData - Tableau de données de notifications
   * @returns {Promise<Array<Notification>>}
   */
  async createMultipleNotifications(notificationsData) {
    if (!Array.isArray(notificationsData) || notificationsData.length === 0) {
      throw new Error('Un tableau de notifications est requis');
    }

    // Airtable limite à 10 enregistrements par batch
    const batches = [];
    for (let i = 0; i < notificationsData.length; i += 10) {
      batches.push(notificationsData.slice(i, i + 10));
    }

    const allCreatedNotifications = [];

    for (const batch of batches) {
      const records = batch.map(data => {
        const notification = new Notification(data);
        const validationErrors = notification.validate();
        if (validationErrors) {
          throw new Error(`Validation échouée pour une notification: ${validationErrors.join(', ')}`);
        }
        return { fields: notification.toAirtableFields() };
      });

      const createdRecords = await base(AIRTABLE_TABLE_NAME).create(records);
      const notifications = createdRecords.map(r => Notification.fromAirtableRecord(r));
      allCreatedNotifications.push(...notifications);
    }

    return allCreatedNotifications;
  },

  /**
   * Récupérer toutes les notifications avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getAllNotifications(options = {}) {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 100;
    const search = options.search || '';
    const statusFilter = options.statusFilter || '';
    const readFilter = options.readFilter || '';
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';

    // Construction des filtres
    let filters = [];

    // Filtre de recherche
    if (search) {
      filters.push(`OR(
        FIND(LOWER("${search}"), LOWER({message})) > 0,
      )`);
    }

    // Filtre par statut
    if (statusFilter) {
      filters.push(`{status} = "${statusFilter}"`);
    }


    // Filtre par statut de lecture
    if (readFilter === 'read') {
      filters.push(`{Read} = TRUE()`);
    } else if (readFilter === 'unread') {
      filters.push(`{Read} = FALSE()`);
    }

    // Combiner tous les filtres
    const filterByFormula = filters.length > 0
      ? (filters.length > 1 ? `AND(${filters.join(', ')})` : filters[0])
      : '';

    // Configuration du tri
    const sortConfig = [{
      field: sortBy === 'created_at' ? 'created_at' :
          sortBy === 'status' ? 'status' :
            'created_at',
      direction: sortOrder === 'asc' ? 'asc' : 'desc'
    }];

    const selectOptions = {
      sort: sortConfig,
    };
    if (filterByFormula) selectOptions.filterByFormula = filterByFormula;

    // Récupérer tous les records
    const allRecords = await base(AIRTABLE_TABLE_NAME)
      .select(selectOptions)
      .all();

    // Calculer la pagination
    const totalRecords = allRecords.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Extraire la page demandée
    const paginatedRecords = allRecords.slice(startIndex, endIndex);

    const notifications = paginatedRecords.map(r => Notification.fromAirtableRecord(r));

    return {
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  },

  /**
   * Récupérer toutes les notifications d'un utilisateur avec pagination
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getNotificationsByUser(userId, options = {}) {
    if (typeof userId === 'object' && userId !== null) {
      userId = userId.id || userId._id || userId.userId;
    }

    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 100;
    const search = options.search || '';
    const statusFilter = options.statusFilter || '';
    const readFilter = options.readFilter || '';
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';

    // Construction du filtre principal
    let filters = [`FIND("${userId}", ARRAYJOIN({user_id}, ",")) > 0`];

    // Ajout du filtre de recherche
    if (search) {
      filters.push(`
        FIND(LOWER("${search}"), LOWER({message})) > 0
      `);
    }

    // Filtre par statut
    if (statusFilter) {
      filters.push(`{status} = "${statusFilter}"`);
    }


    // Filtre par statut de lecture
    if (readFilter === 'read') {
      filters.push(`{Read} = TRUE()`);
    } else if (readFilter === 'unread') {
      filters.push(`{Read} = FALSE()`);
    }

    // Combiner tous les filtres
    const finalFilter = filters.length > 1
      ? `AND(${filters.join(', ')})`
      : filters[0];

    console.log('Final filter formula:', finalFilter);

    // Configuration du tri
    const sortConfig = [{
      field: sortBy === 'created_at' ? 'created_at' :
          sortBy === 'status' ? 'status' :
            'created_at',
      direction: sortOrder === 'asc' ? 'asc' : 'desc'
    }];

    const selectOptions = {
      filterByFormula: finalFilter,
      sort: sortConfig,
    };

    try {
      const allRecords = await base(AIRTABLE_TABLE_NAME)
        .select(selectOptions)
        .all();

      const totalRecords = allRecords.length;
      const totalPages = Math.ceil(totalRecords / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedRecords = allRecords.slice(startIndex, endIndex);
      const notifications = paginatedRecords.map(r => Notification.fromAirtableRecord(r));

      return {
        data: notifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Airtable filter error:', error.message);
      throw error;
    }
  },

  /**
   * Récupérer une notification par ID
   * @param {string} id - ID de la notification
   * @returns {Promise<Notification>}
   */
  async getNotificationById(id) {
    if (!id) {
      throw new Error('ID de notification requis');
    }

    try {
      const record = await base(AIRTABLE_TABLE_NAME).find(id);
      return Notification.fromAirtableRecord(record);
    } catch (error) {
      if (error.statusCode === 404) return null;
      throw new Error(`Erreur lors de la recherche par ID: ${error.message}`);
    }
  },

  /**
   * Mettre à jour une notification
   * @param {string} id - ID de la notification
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Notification>}
   */
  async updateNotification(id, updateData) {
    if (!id) {
      throw new Error('ID de notification requis');
    }

    const existing = await this.getNotificationById(id);
    if (!existing) throw new Error("Notification introuvable");

    Object.assign(existing, updateData);

    const validationErrors = existing.validate();
    if (validationErrors) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }

    const records = await base(AIRTABLE_TABLE_NAME).update([
      { id, fields: existing.toAirtableFields() }
    ]);

    return Notification.fromAirtableRecord(records[0]);
  },

  /**
   * Marquer une notification comme lue
   * @param {string} id - ID de la notification
   * @returns {Promise<Notification>}
   */
  async markAsRead(id) {
    if (!id) {
      throw new Error('ID de notification requis');
    }

    const records = await base(AIRTABLE_TABLE_NAME).update([
      { id, fields: { 'Read': true } }
    ]);

    return Notification.fromAirtableRecord(records[0]);
  },

  /**
   * Marquer une notification comme non lue
   * @param {string} id - ID de la notification
   * @returns {Promise<Notification>}
   */
  async markAsUnread(id) {
    if (!id) {
      throw new Error('ID de notification requis');
    }

    const records = await base(AIRTABLE_TABLE_NAME).update([
      { id, fields: { 'Read': false } }
    ]);

    return Notification.fromAirtableRecord(records[0]);
  },

  /**
   * Marquer plusieurs notifications comme lues
   * @param {Array<string>} ids - IDs des notifications
   * @returns {Promise<Object>}
   */
  async markMultipleAsRead(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Un tableau d\'IDs est requis');
    }

    const batches = [];
    for (let i = 0; i < ids.length; i += 10) {
      batches.push(ids.slice(i, i + 10));
    }

    let successCount = 0;
    let failCount = 0;

    for (const batch of batches) {
      try {
        const updates = batch.map(id => ({
          id,
          fields: { 'Read': true }
        }));

        await base(AIRTABLE_TABLE_NAME).update(updates);
        successCount += batch.length;
      } catch (error) {
        console.error('Erreur lors du batch update:', error);
        failCount += batch.length;
      }
    }

    return {
      success: true,
      message: `${successCount} notifications marquées comme lues${failCount > 0 ? `, ${failCount} échecs` : ''}`,
      successful: successCount,
      failed: failCount
    };
  },

  /**
   * Marquer plusieurs notifications comme non lues
   * @param {Array<string>} ids - IDs des notifications
   * @returns {Promise<Object>}
   */
  async markMultipleAsUnread(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Un tableau d\'IDs est requis');
    }

    const batches = [];
    for (let i = 0; i < ids.length; i += 10) {
      batches.push(ids.slice(i, i + 10));
    }

    let successCount = 0;
    let failCount = 0;

    for (const batch of batches) {
      try {
        const updates = batch.map(id => ({
          id,
          fields: { 'Read': false }
        }));

        await base(AIRTABLE_TABLE_NAME).update(updates);
        successCount += batch.length;
      } catch (error) {
        console.error('Erreur lors du batch update:', error);
        failCount += batch.length;
      }
    }

    return {
      success: true,
      message: `${successCount} notifications marquées comme non lues${failCount > 0 ? `, ${failCount} échecs` : ''}`,
      successful: successCount,
      failed: failCount
    };
  },

  /**
   * Marquer toutes les notifications comme lues
   * @returns {Promise<Object>}
   */
  async markAllAsRead() {
    const selectOptions = {
      filterByFormula: '{Read} = FALSE()',
      fields: ['Read']
    };

    const allUnreadRecords = await base(AIRTABLE_TABLE_NAME)
      .select(selectOptions)
      .all();

    if (allUnreadRecords.length === 0) {
      return {
        success: true,
        message: 'Aucune notification non lue trouvée',
        updatedCount: 0
      };
    }

    const ids = allUnreadRecords.map(record => record.id);
    const result = await this.markMultipleAsRead(ids);

    return {
      success: true,
      message: `${result.successful} notifications marquées comme lues`,
      updatedCount: result.successful
    };
  },

  /**
   * Supprimer une notification
   * @param {string} id - ID de la notification
   * @returns {Promise<boolean>}
   */
  async deleteNotification(id) {
    if (!id) {
      throw new Error('ID de notification requis');
    }

    await base(AIRTABLE_TABLE_NAME).destroy([id]);
    return true;
  },

  /**
   * Supprimer plusieurs notifications
   * @param {Array<string>} ids - IDs des notifications
   * @returns {Promise<Object>}
   */
  async deleteMultipleNotifications(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Un tableau d\'IDs est requis');
    }

    // Airtable permet de supprimer jusqu'à 10 enregistrements à la fois
    const batches = [];
    for (let i = 0; i < ids.length; i += 10) {
      batches.push(ids.slice(i, i + 10));
    }

    let deletedCount = 0;

    for (const batch of batches) {
      try {
        await base(AIRTABLE_TABLE_NAME).destroy(batch);
        deletedCount += batch.length;
      } catch (error) {
        console.error('Erreur lors de la suppression du batch:', error);
      }
    }

    return {
      success: true,
      message: `${deletedCount} notifications supprimées avec succès`,
      deletedCount
    };
  },

  /**
   * Obtenir le nombre de notifications non lues
   * @param {string} userId - ID de l'utilisateur (optionnel)
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId = null) {
    let filterByFormula = '{Read} = FALSE()';

    if (userId) {
      filterByFormula = `AND(${filterByFormula}, FIND("${userId}", ARRAYJOIN({user_id}, ",")) > 0)`;
    }

    const selectOptions = {
      filterByFormula,
      fields: ['Read']
    };

    const unreadRecords = await base(AIRTABLE_TABLE_NAME)
      .select(selectOptions)
      .all();

    return unreadRecords.length;
  },

  /**
   * Nettoyer les anciennes notifications (supprimer les notifications de plus de X jours)
   * @param {number} daysOld - Nombre de jours
   * @returns {Promise<Object>}
   */
  async cleanOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();

    const selectOptions = {
      filterByFormula: `IS_BEFORE({created_at}, "${cutoffISO}")`
    };

    const oldRecords = await base(AIRTABLE_TABLE_NAME)
      .select(selectOptions)
      .all();

    if (oldRecords.length === 0) {
      return {
        success: true,
        message: `Aucune notification de plus de ${daysOld} jours trouvée`,
        deletedCount: 0
      };
    }

    const ids = oldRecords.map(record => record.id);
    const result = await this.deleteMultipleNotifications(ids);

    return {
      success: true,
      message: `${result.deletedCount} anciennes notifications supprimées`,
      deletedCount: result.deletedCount
    };
  },

  /**
   * Obtenir des statistiques sur les notifications
   * @param {string} userId - ID de l'utilisateur (optionnel)
   * @returns {Promise<Object>}
   */
  async getNotificationsStats(userId = null) {
    let filterByFormula = '';

    if (userId) {
      filterByFormula = `FIND("${userId}", ARRAYJOIN({user_id}, ",")) > 0`;
    }

    const selectOptions = {
      fields: ['status', 'Read', 'created_at']
    };

    if (filterByFormula) {
      selectOptions.filterByFormula = filterByFormula;
    }

    const allRecords = await base(AIRTABLE_TABLE_NAME)
      .select(selectOptions)
      .all();

    const stats = {
      total: allRecords.length,
      unread: 0,
      read: 0,
      byStatus: {
        success: 0,
        warning: 0,
        error: 0,
        info: 0
      },
      today: 0
    };

    const today = new Date().toDateString();

    allRecords.forEach(record => {
      const isRead = record.fields['Read'] || false;
      const status = record.fields['status'] || 'info';
      const createdAt = record.fields['created_at'];

      // Comptage par statut de lecture
      if (isRead) {
        stats.read++;
      } else {
        stats.unread++;
      }

      // Comptage par statut
      if (stats.byStatus.hasOwnProperty(status)) {
        stats.byStatus[status]++;
      }


      // Comptage des notifications d'aujourd'hui
      if (createdAt) {
        const notifDate = new Date(createdAt).toDateString();
        if (notifDate === today) {
          stats.today++;
        }
      }
    });

    return stats;
  },

  /**
   * Rechercher des notifications selon des critères
   * @param {Object} criteria - Critères de recherche
   * @returns {Promise<Object>}
   */
  async searchNotifications(criteria) {
    const options = {
      page: criteria.page,
      limit: criteria.limit,
      search: criteria.search,
      statusFilter: criteria.statusFilter,
      readFilter: criteria.readFilter,
      sortBy: criteria.sortBy,
      sortOrder: criteria.sortOrder
    };

    return this.getAllNotifications(options);
  }
};

module.exports = notificationService;