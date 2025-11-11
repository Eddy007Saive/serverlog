const { base } = require('../config/airtable');
const Contact = require('../models/Contact');
const axios = require('axios');
const campagneService = require('./campagneService');

const AIRTABLE_TABLE_NAME ='Contacts';

const contactService = {
  /**
   * Créer un nouveau contact
   * @param {Object} data - Données du contact
   * @returns {Promise<Contact>}
   */
  async createContact(data) {
    const contact = new Contact(data);

    const validationErrors = contact.validate();
    if (validationErrors) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }

    const fields = contact.toAirtableFields();
    console.log('Fields to create:', JSON.stringify(fields, null, 2));

    const records = await base(AIRTABLE_TABLE_NAME).create([
      { fields }
    ]);

    return Contact.fromAirtableRecord(records[0]);
  },

  /**
   * Créer plusieurs contacts en batch
   * @param {Array<Object>} contactsData - Tableau de données de contacts
   * @returns {Promise<Array<Contact>>}
   */
  async createMultipleContacts(contactsData) {
    if (!Array.isArray(contactsData) || contactsData.length === 0) {
      throw new Error('Un tableau de contacts est requis');
    }

    // Airtable limite à 10 enregistrements par batch
    const batches = [];
    for (let i = 0; i < contactsData.length; i += 10) {
      batches.push(contactsData.slice(i, i + 10));
    }

    const allCreatedContacts = [];

    for (const batch of batches) {
      const records = batch.map(data => {
        const contact = new Contact(data);
        const validationErrors = contact.validate();
        if (validationErrors) {
          throw new Error(`Validation échouée pour un contact: ${validationErrors.join(', ')}`);
        }
        return { fields: contact.toAirtableFields() };
      });

      const createdRecords = await base(AIRTABLE_TABLE_NAME).create(records);
      const contacts = createdRecords.map(r => Contact.fromAirtableRecord(r));
      allCreatedContacts.push(...contacts);
    }

    return allCreatedContacts;
  },

  /**
   * Récupérer tous les contacts avec pagination et filtres
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getAllContacts(options = {}) {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 100;
    const filterByFormula = options.filterByFormula || '';
    const sort = options.sort || [];

    const selectOptions = {
      sort: sort.length ? sort : [{ field: 'Nom', direction: 'asc' }],
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

    const contacts = paginatedRecords.map(r => Contact.fromAirtableRecord(r));

    return {
      data: contacts,
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
   * Récupérer tous les contacts d'un utilisateur avec pagination
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getAllContactsByUser(userId, options = {}) {
    // Extraire l'ID si un objet user est passé
    if (typeof userId === 'object' && userId !== null) {
      userId = userId.id || userId._id || userId.userId;
    }
    
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 100;
    const filterByFormula = options.filterByFormula || '';
    const sort = options.sort || [];
    
    // Filtre par user_id (champ Lookup)
    let userFilter = `FIND("${userId}", ARRAYJOIN({user_id}, ",")) > 0`;
    
    // Combiner avec un filtre supplémentaire si fourni
    const finalFilter = filterByFormula 
      ? `AND(${userFilter}, ${filterByFormula})`
      : userFilter;

    console.log('Final filter formula:', finalFilter);

    const selectOptions = {
      filterByFormula: finalFilter,
      sort: sort.length ? sort : [{ field: 'Nom', direction: 'asc' }],
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
      const contacts = paginatedRecords.map(r => Contact.fromAirtableRecord(r));

      console.log('Total contacts found:', totalRecords);

      return {
        data: contacts,
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
   * Récupérer tous les contacts d'une campagne
   * @param {string} campagneId - ID de la campagne
   * @param {Object} options - Options de recherche et pagination
   * @returns {Promise<Object>} - { data, pagination }
   */
  async getContactsByCampagne(campagneId, options = {}) {
    if (!campagneId) {
      throw new Error('ID de campagne requis');
    }

    const idCamp=await campagneService.getCampagneById(campagneId)
    
    

    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 100;
    const search = options.search || '';
    const statusFilter = options.statusFilter || '';
    const profileFilter = options.profileFilter || '';
    const userId = options.userId;

    let filters = [];

    // Filtre principal par campagne
    filters.push(`FIND("${idCamp.ID}", ARRAYJOIN({ID (from Campagne)}))`);

    // Filtre par utilisateur si fourni
    // if (userId) {
    //   filters.push(`SEARCH("${userId}", ARRAYJOIN({user_id}))`);
    // }

    // Filtre de recherche
    if (search) {
      filters.push(`OR(
        SEARCH(LOWER("${search}"), LOWER({Nom})),
        SEARCH(LOWER("${search}"), LOWER({Email})),
        SEARCH(LOWER("${search}"), LOWER({Entreprise actuelle})),
        SEARCH(LOWER("${search}"), LOWER({Poste actuel}))
      )`);
    }

    // Filtre par statut
    if (statusFilter) {
      filters.push(`{Statut} = "${statusFilter}"`);
    }

    // Filtre par profil
    if (profileFilter) {
      filters.push(`{Profil} = "${profileFilter}"`);
    }

    const filterByFormula = filters.length === 1 
      ? filters[0] 
      : `AND(${filters.join(', ')})`;

    const selectOptions = {
      filterByFormula,
      sort: options.sort || [{ field: 'Nom', direction: 'asc' }]
    };

    const allRecords = await base(AIRTABLE_TABLE_NAME)
      .select(selectOptions)
      .all();

    const totalRecords = allRecords.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedRecords = allRecords.slice(startIndex, endIndex);
    const contacts = paginatedRecords.map(r => Contact.fromAirtableRecord(r));

    return {
      data: contacts,
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
   * Récupérer un contact par ID
   * @param {string} id - ID du contact
   * @returns {Promise<Contact>}
   */
  async getContactById(id) {
    if (!id) {
      throw new Error('ID de contact requis');
    }

    try {
      const record = await base(AIRTABLE_TABLE_NAME).find(id);
      return Contact.fromAirtableRecord(record);
    } catch (error) {
      if (error.statusCode === 404) return null;
      throw new Error(`Erreur lors de la recherche par ID: ${error.message}`);
    }
  },

  /**
   * Mettre à jour un contact
   * @param {string} id - ID du contact
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Contact>}
   */
  async updateContact(id, updateData) {
    if (!id) {
      throw new Error('ID de contact requis');
    }

    const existing = await this.getContactById(id);
    if (!existing) throw new Error("Contact introuvable");

    Object.assign(existing, updateData);

    const validationErrors = existing.validate();
    if (validationErrors) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }

    const records = await base(AIRTABLE_TABLE_NAME).update([
      { id, fields: existing.toAirtableFields() }
    ]);

    return Contact.fromAirtableRecord(records[0]);
  },

  /**
   * Mettre à jour le statut d'un contact
   * @param {string} id - ID du contact
   * @param {string} statut - Nouveau statut
   * @returns {Promise<Contact>}
   */
  async updateContactStatus(id, statut) {
    if (!id) {
      throw new Error('ID de contact requis');
    }

    const records = await base(AIRTABLE_TABLE_NAME).update([
      { id, fields: { 'Statut': statut } }
    ]);

    return Contact.fromAirtableRecord(records[0]);
  },

  /**
   * Mettre à jour le profil d'un contact
   * @param {string} id - ID du contact
   * @param {string} profil - Nouveau profil (GARDE, REJETE, En attente)
   * @returns {Promise<Contact>}
   */
  async updateContactProfile(id, profil) {
    if (!id) {
      throw new Error('ID de contact requis');
    }

    const validProfiles = ['GARDE', 'REJETE', 'En attente'];
    if (!validProfiles.includes(profil)) {
      throw new Error(`Profil invalide. Valeurs acceptées: ${validProfiles.join(', ')}`);
    }

    const records = await base(AIRTABLE_TABLE_NAME).update([
      { id, fields: { 'Profil': profil } }
    ]);

    return Contact.fromAirtableRecord(records[0]);
  },

  /**
   * Supprimer un contact
   * @param {string} id - ID du contact
   * @returns {Promise<boolean>}
   */
  async deleteContact(id) {
    if (!id) {
      throw new Error('ID de contact requis');
    }

    await base(AIRTABLE_TABLE_NAME).destroy([id]);
    return true;
  },

  /**
   * Trier automatiquement les profils d'une campagne
   * @param {string} campagneId - ID de la campagne
   * @returns {Promise<Object>}
   */
  async autoSortProfiles(campagneId) {
    if (!campagneId) {
      throw new Error('ID de campagne requis');
    }

    try {
      const response = await axios.post(
        'https://n8n.srv903010.hstgr.cloud/webhook/trier/profils',
        { id: campagneId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return {
        success: true,
        message: 'Tri automatique des profils lancé avec succès',
        data: response.data
      };
    } catch (error) {
      throw new Error(`Erreur lors du tri automatique: ${error.message}`);
    }
  },

  /**
   * Retrier manuellement les profils d'une campagne
   * @param {string} campagneId - ID de la campagne
   * @returns {Promise<Object>}
   */
  async manualSortProfiles(campagneId) {
    if (!campagneId) {
      throw new Error('ID de campagne requis');
    }

    try {
      const response = await axios.post(
        'https://n8n.srv903010.hstgr.cloud/webhook/retrier/profils',
        { id: campagneId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return {
        success: true,
        message: 'Retri des profils lancé avec succès',
        data: response.data
      };
    } catch (error) {
      throw new Error(`Erreur lors du retri manuel: ${error.message}`);
    }
  },

  /**
   * Obtenir des statistiques sur les contacts
   * @param {string} userId - ID utilisateur (optionnel)
   * @returns {Promise<Object>}
   */
  async getContactsStats(userId = null) {
    let filterByFormula = '';
    
    if (userId) {
      filterByFormula = `FIND("${userId}", ARRAYJOIN({user_id}, ",")) > 0`;
    }

    const allRecords = await base(AIRTABLE_TABLE_NAME)
      .select({ 
        filterByFormula,
        fields: ['Statut', 'Profil']
      })
      .all();

    const stats = {
      total: allRecords.length,
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

    allRecords.forEach(record => {
      const statut = record.fields['Statut'] || 'À contacter';
      const profil = record.fields['Profil'] || 'En attente';

      // Statistiques par statut
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

      // Statistiques par profil
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

    return stats;
  },

  /**
   * Rechercher des contacts selon des critères avec pagination
   * @param {Object} criteria - Critères de recherche
   * @returns {Promise<Object>}
   */
  async searchContacts(criteria) {
    const options = this._buildSearchOptions(criteria);
    return this.getAllContacts(options);
  },

  /**
   * Construire les options de recherche Airtable
   * @private
   */
  _buildSearchOptions(criteria) {
    const options = {};
    const filters = [];

    if (criteria.search) {
      filters.push(`OR(
        SEARCH(LOWER("${criteria.search}"), LOWER({Nom})),
        SEARCH(LOWER("${criteria.search}"), LOWER({Email})),
        SEARCH(LOWER("${criteria.search}"), LOWER({Entreprise actuelle})),
        SEARCH(LOWER("${criteria.search}"), LOWER({Poste actuel}))
      )`);
    }

    if (criteria.statut) {
      filters.push(`{Statut} = '${criteria.statut}'`);
    }

    if (criteria.profil) {
      filters.push(`{Profil} = '${criteria.profil}'`);
    }

    if (criteria.campagne) {
      filters.push(`FIND("${criteria.campagne}", ARRAYJOIN({Campagne}))`);
    }

    if (filters.length > 0) {
      options.filterByFormula = filters.length === 1 
        ? filters[0] 
        : `AND(${filters.join(', ')})`;
    }

    if (criteria.sortBy) {
      options.sort = [{ 
        field: criteria.sortBy, 
        direction: criteria.sortOrder || 'asc' 
      }];
    }

    if (criteria.page) options.page = criteria.page;
    if (criteria.limit) options.limit = criteria.limit;

    return options;
  }
};

module.exports = contactService;