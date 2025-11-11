const { base, airtableConfig } = require('../config/airtable');
const Campagne = require('../models/Campagne');
const axios = require('axios');

const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Campagnes';

const campagneService = {
  /**
   * Créer une nouvelle campagne
   * @param {Object} data - Données de la campagne
   * @returns {Promise<Campagne>}
   */
  async createCampagne(data) {
    const campagne = new Campagne(data);

    const validationErrors = campagne.validate();
    if (validationErrors) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }
    const fields = campagne.toAirtableFields();
    console.log('Fields to create:', JSON.stringify(fields, null, 2));

    const records = await base(AIRTABLE_TABLE_NAME).create([
      { fields }
    ]);

    return Campagne.fromAirtableRecord(records[0]);
  },

  /**
   * Récupérer toutes les campagnes avec pagination
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getAllCampagnes(options = {}) {
    // Options de pagination
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 100;
    const filterByFormula = options.filterByFormula || '';
    const sort = options.sort || [];

    const selectOptions = {
      sort: sort.length ? sort : [{ field: 'Nom de la campagne', direction: 'asc' }],
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

    const campagnes = paginatedRecords.map(r => Campagne.fromAirtableRecord(r));

    return {
      data: campagnes,
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
   * Récupérer toutes les campagnes d'un utilisateur avec pagination
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getAllCampagnesByUser(userId, options = {}) {

    // Extraire l'ID si un objet user est passé
    if (typeof userId === 'object' && userId !== null) {
      userId = userId.id || userId._id || userId.userId;
    }

    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    // Options de pagination
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 100;
    const filterByFormula = options.filterByFormula || '';
    const sort = options.sort || [];

    // Pour un champ Lookup, utiliser ARRAYJOIN
    let userFilter = `FIND("${userId}", ARRAYJOIN({user_id}, ",")) > 0`;

    // Combiner avec un filtre supplémentaire si fourni
    const finalFilter = filterByFormula
      ? `AND(${userFilter}, ${filterByFormula})`
      : userFilter;

    console.log('Final filter formula:', finalFilter);

    const selectOptions = {
      filterByFormula: finalFilter,
      sort: sort.length ? sort : [{ field: 'Nom de la campagne', direction: 'asc' }],
    };

    try {
      // Récupérer tous les records correspondants
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

      const campagnes = paginatedRecords.map(r => Campagne.fromAirtableRecord(r));

      console.log('Total records found:', campagnes);

      return {
        data: campagnes,
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
      console.error('Filter used:', finalFilter);
      throw error;
    }
  },

  /**
   * Récupérer une campagne par ID
   * @param {string} id - ID de la campagne
   * @returns {Promise<Campagne>}
   */
  async getCampagneById(id) {

    if (!id) {
      throw new Error('ID de campagne requis');
    }

    try {
      const record = await base(AIRTABLE_TABLE_NAME).find(id);
      return Campagne.fromAirtableRecord(record);
    } catch (error) {
      if (error.statusCode === 404) return null;
      throw new Error(`Erreur lors de la recherche par ID: ${error.message}`);
    }
  },

  /**
   * Mettre à jour une campagne
   * @param {string} id - ID de la campagne
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Campagne>}
   */
  async updateCampagne(id, updateData) {

    if (!id) {
      throw new Error('ID de campagne requis');
    }
    const existing = await this.getCampagneById(id);
    if (!existing) throw new Error("Campagne introuvable");

    console.log("avnat", updateData);
    // Formater updateData
    const formattedUpdate = {
      nom: updateData['Nom de la campagne'],
      poste: updateData['Poste recherché'],
      zone: updateData['Zone géographique'],
      seniorite: updateData['Seniorite'],
      tailleEntreprise: updateData['Taille_entreprise'],
      langues: updateData['Langues parlées'],
      secteurs: updateData['Secteurs souhaités'],
      statut: updateData['Statut'],
      Template_message: updateData['Template_message'],
      enrichissement: updateData["Statut d'enrichissement"],
      jours_enrichissement: updateData['Jours_enrichissement'],
      profileParJours: updateData['Profils/jour'],
      messageParJours: updateData['Messages/jour'],
      InstructionRelance4Jours: updateData['InstructionRelance4Jours'],
      InstructionRelance7Jours: updateData['InstructionRelance7Jours'],
      InstructionRelance14Jours: updateData['InstructionRelance14Jours']
    };

    const updatedCampagne = new Campagne({
      ...existing,  // Toutes les données existantes
      ...formattedUpdate // Les modifications
    });


    const validationErrors = existing.validate();
    if (validationErrors) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }
    const records = await base(AIRTABLE_TABLE_NAME).update([
      { id, fields: updatedCampagne.toAirtableFields() }
    ]);


    return Campagne.fromAirtableRecord(records[0]);
  },

  /**
   * Supprimer une campagne
   * @param {string} id - ID de la campagne
   * @returns {Promise<boolean>}
   */
  async deleteCampagne(id) {
    if (!id) {
      throw new Error('ID de campagne requis');
    }

    await base(AIRTABLE_TABLE_NAME).destroy([id]);
    return true;
  },

  /**
   * Lancer une campagne via webhook
   * @param {string} id - ID de la campagne
   * @returns {Promise<Object>} - Réponse du webhook
   */
  async lancerCampagne(id) {
    if (!id) {
      throw new Error('ID de campagne requis');
    }

    // Récupérer la campagne
    const campagne = await this.getCampagneById(id);

    if (!campagne) {
      throw new Error('Campagne introuvable');
    }

    // Vérifier la présence du webhook
    if (!campagne.lancerCampagne || !campagne.lancerCampagne.url) {
      throw new Error('URL de webhook non trouvée pour cette campagne');
    }

    // Appel du webhook
    try {
      const webhookResponse = await axios.post(campagne.lancerCampagne.url, {
        campagneId: id,
        campagneName: campagne.nom,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Campagne lancée avec succès',
        webhookData: webhookResponse.data
      };
    } catch (webhookError) {
      throw new Error(`Erreur lors de l'appel du webhook: ${webhookError.message}`);
    }
  },

  /**
   * Rechercher des campagnes selon des critères avec pagination
   * @param {Object} criteria - Critères de recherche et options de pagination
   * @returns {Promise<Object>} - { data, pagination }
   */
  async searchCampagnes(criteria) {
    const options = this._buildSearchOptions(criteria);
    return this.getAllCampagnes(options);
  },

  /**
   * Construire les options de recherche Airtable
   * @private
   */
  _buildSearchOptions(criteria) {
    const options = {};

    if (criteria.status) {
      options.filterByFormula = `{Status} = '${criteria.status}'`;
    }

    if (criteria.sortBy) {
      options.sort = [{
        field: criteria.sortBy,
        direction: criteria.sortOrder || 'asc'
      }];
    }

    if (criteria.maxRecords) {
      options.maxRecords = criteria.maxRecords;
    }

    return options;
  },

  /**
   * Obtenir des statistiques sur les campagnes
   * @returns {Promise<Object>}
   */
  async getCampagneStats() {
    const campagnes = await this.getAllCampagnes();

    return {
      total: campagnes.length,
      byStatus: this._groupByStatus(campagnes),
      recent: campagnes.slice(0, 5)
    };
  },

  /**
   * Grouper les campagnes par statut
   * @private
   */
  _groupByStatus(campagnes) {
    return campagnes.reduce((acc, campagne) => {
      const status = campagne.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }
};

module.exports = campagneService;