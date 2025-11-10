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

    const records = await base(AIRTABLE_TABLE_NAME).create([
      { fields: campagne.toAirtableFields() }
    ]);

    return Campagne.fromAirtableRecord(records[0]);
  },

  /**
   * Récupérer toutes les campagnes
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array<Campagne>>}
   */
  async getAllCampagnes(options = {}) {
    const { maxRecords = 100, filterByFormula = '', sort = [] } = options;
    const selectOptions = {
      maxRecords,
      sort: sort.length ? sort : [{ field: 'Nom de la campagne', direction: 'asc' }],
    };
    if (filterByFormula) selectOptions.filterByFormula = filterByFormula;

    const records = await base(AIRTABLE_TABLE_NAME)
      .select(selectOptions)
      .all();

    return records.map(r => Campagne.fromAirtableRecord(r));
  },

 /**
   * Récupérer toutes les campagnes d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array<Campagne>>}
   */
  async getAllCampagnesByUser(userId, options = {}) {
    console.log('getAllCampagnesByUser called with:', { userId, options });
    
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    // Déstructuration sécurisée avec vérification
    const maxRecords = options.maxRecords || 100;
    const filterByFormula = options.filterByFormula || '';
    const sort = options.sort || [];
    
    console.log('Options parsed:', { maxRecords, filterByFormula, sort });
    
    // Pour un champ Lookup, utiliser ARRAYJOIN avec & pour la concaténation
    // Le user_id est probablement un nombre dans le lookup
    let userFilter = `SEARCH("${userId}", ARRAYJOIN({user_id}))`;
    
    console.log('User filter created:', userFilter);
    
    // Combiner avec un filtre supplémentaire si fourni
    const finalFilter = filterByFormula 
      ? `AND(${userFilter}, ${filterByFormula})`
      : userFilter;

    console.log('Final filter formula:', finalFilter);

    const selectOptions = {
      maxRecords,
      filterByFormula: finalFilter,
      sort: sort.length ? sort : [{ field: 'Nom de la campagne', direction: 'asc' }],
    };

    console.log('Select options:', JSON.stringify(selectOptions));

    try {
      const records = await base(AIRTABLE_TABLE_NAME)
        .select(selectOptions)
        .all();

      console.log('Records retrieved:', records.length);
      return records.map(r => Campagne.fromAirtableRecord(r));
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

    Object.assign(existing, updateData);

    const validationErrors = existing.validate();
    if (validationErrors) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }

    const records = await base(AIRTABLE_TABLE_NAME).update([
      { id, fields: existing.toAirtableFields() }
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
   * Rechercher des campagnes selon des critères
   * @param {Object} criteria - Critères de recherche
   * @returns {Promise<Array<Campagne>>}
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