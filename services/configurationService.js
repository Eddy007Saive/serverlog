const { base } = require('../config/airtable');
const Configuration = require('../models/Configuration');

const CONFIG_TABLE_NAME = 'configuration_cookies';
const QUOTA_TABLE_NAME = 'Quota par jours';

const configurationService = {
  /**
   * Récupérer la configuration d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Configuration|null>}
   */
  async getConfiguration(userId) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    try {
      const records = await base(CONFIG_TABLE_NAME)
        .select({
          filterByFormula: `SEARCH("${userId}", ARRAYJOIN({user_id}))`,
          maxRecords: 1
        })
        .all();

      if (records.length === 0) {
        return null;
      }

      return Configuration.fromAirtableRecord(records[0]);
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      throw new Error(`Erreur lors de la récupération de la configuration: ${error.message}`);
    }
  },

  /**
   * Créer une nouvelle configuration
   * @param {Object} data - Données de la configuration
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Configuration>}
   */
  async createConfiguration(data, userId) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    const configuration = new Configuration({
      nom: data.nom || 'LinkedIn Cookies',
      valeur: data.valeur || data.liAt || '',
      email: data.email || '',
      status: data.status || 'Actif',
      userAgent: data.userAgent || '',
      userId: userId
    });

    const validationErrors = configuration.validate();
    if (validationErrors) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }

    try {
      const fields = configuration.toAirtableFields();
      fields['Users'] = [userId];

      const records = await base(CONFIG_TABLE_NAME).create([{ fields }]);
      
      const quota=await this.createQuota(userId,50);
      
      return Configuration.fromAirtableRecord(records[0]);
    } catch (error) {
      console.error('Erreur lors de la création de la configuration:', error);
      throw new Error(`Erreur lors de la création de la configuration: ${error.message}`);
    }
  },

  /**
   * Mettre à jour une configuration existante
   * @param {string} configId - ID de la configuration
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Configuration>}
   */
  async updateConfiguration(configId, updateData) {
    if (!configId) {
      throw new Error('ID de configuration requis');
    }

    try {
      const existing = await this.getConfigurationById(configId);
      if (!existing) {
        throw new Error('Configuration introuvable');
      }

      Object.assign(existing, updateData);

      const validationErrors = existing.validate();
      if (validationErrors) {
        throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
      }

      const fields = existing.toAirtableFields();
      
      const records = await base(CONFIG_TABLE_NAME).update([
        { id: configId, fields }
      ]);

      return Configuration.fromAirtableRecord(records[0]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration:', error);
      throw new Error(`Erreur lors de la mise à jour de la configuration: ${error.message}`);
    }
  },

  /**
   * Mettre à jour ou créer la configuration d'un utilisateur
   * @param {Object} data - Données de la configuration
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Configuration>}
   */
  async upsertConfiguration(data, userId) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    try {
      const existing = await this.getConfiguration(userId);

      if (!existing) {
        // Créer la configuration et le quota par défaut
        const newConfig = await this.createConfiguration(data, userId);
        
        // Créer le quota par défaut
        try {
          await this.createQuota(userId, 50);
        } catch (quotaError) {
          console.error('Erreur lors de la création du quota:', quotaError);
          // On continue même si le quota échoue
        }

        return newConfig;
      }

      // Mettre à jour la configuration existante
      return await this.updateConfiguration(existing.id, data);
    } catch (error) {
      console.error('Erreur lors de l\'upsert de la configuration:', error);
      throw error;
    }
  },

  /**
   * Récupérer une configuration par ID
   * @param {string} id - ID de la configuration
   * @returns {Promise<Configuration|null>}
   */
  async getConfigurationById(id) {
    if (!id) {
      throw new Error('ID de configuration requis');
    }

    try {
      const record = await base(CONFIG_TABLE_NAME).find(id);
      return Configuration.fromAirtableRecord(record);
    } catch (error) {
      if (error.statusCode === 404) return null;
      throw new Error(`Erreur lors de la recherche par ID: ${error.message}`);
    }
  },

  /**
   * Valider la configuration d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>}
   */
  async validateConfiguration(userId) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    try {
      const config = await this.getConfiguration(userId);

      if (!config) {
        return {
          success: false,
          valid: false,
          message: 'Configuration non trouvée',
          details: {}
        };
      }

      const { valeur, email, status, userAgent } = config;

      // Validation du cookie li_at
      const isValidCookie = valeur && valeur.length > 50 && valeur.startsWith('AQEDA');

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = email && emailRegex.test(email);

      // Validation du User-Agent
      const isValidUserAgent = userAgent && userAgent.length > 50 && userAgent.includes('Mozilla');

      const isActive = status === 'Actif';
      const isFullyValid = isValidCookie && isValidEmail && isActive;

      return {
        success: true,
        valid: isFullyValid,
        message: isFullyValid
          ? 'Configuration complète et valide'
          : this._getValidationMessage(isValidCookie, isValidEmail, isActive),
        details: {
          cookieValid: isValidCookie,
          emailValid: isValidEmail,
          userAgentValid: isValidUserAgent,
          statusActive: isActive,
          cookieLength: valeur ? valeur.length : 0,
          email: email || ''
        }
      };
    } catch (error) {
      console.error('Erreur lors de la validation de la configuration:', error);
      return {
        success: false,
        valid: false,
        message: 'Erreur lors de la validation'
      };
    }
  },

  /**
   * Supprimer une configuration
   * @param {string} id - ID de la configuration
   * @returns {Promise<boolean>}
   */
  async deleteConfiguration(id) {
    if (!id) {
      throw new Error('ID de configuration requis');
    }

    try {
      await base(CONFIG_TABLE_NAME).destroy([id]);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la configuration:', error);
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  },

  // ========== GESTION QUOTAS ==========

  /**
   * Récupérer le quota d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object|null>}
   */
  async getQuota(userId) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    try {
      const records = await base(QUOTA_TABLE_NAME)
        .select({
          filterByFormula: `FIND("${userId}", ARRAYJOIN({user_id}))`,
          maxRecords: 1
        })
        .all();

      if (records.length === 0) {
        return null;
      }

      const record = records[0];
      return {
        id: record.id,
        quotaRestant: record.fields['Quota restant'] || 0,
        derniereMiseAJour: record.fields['Dernière mise à jour'] || '',
        idCampagneActive: record.fields['ID Campagne active'] || '',
        userId: record.fields['Users'] || []
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du quota:', error);
      throw new Error(`Erreur lors de la récupération du quota: ${error.message}`);
    }
  },

  /**
   * Créer un quota pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} quotaRestant - Quota initial
   * @returns {Promise<Object>}
   */
  async createQuota(userId, quotaRestant = 50) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    try {
      const newQuota = {
        'Quota restant': quotaRestant,
        'ID Campagne active': '',
        'Users': [userId]
      };

      const records = await base(QUOTA_TABLE_NAME).create([
        { fields: newQuota }
      ]);

      const record = records[0];
      return {
        id: record.id,
        quotaRestant: record.fields['Quota restant'],
        derniereMiseAJour: record.fields['Dernière mise à jour'] || '',
        idCampagneActive: record.fields['ID Campagne active'] || '',
        userId: record.fields['Users']
      };
    } catch (error) {
      console.error('Erreur lors de la création du quota:', error);
      throw new Error(`Erreur lors de la création du quota: ${error.message}`);
    }
  },

  /**
   * Mettre à jour le quota d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} quotaData - Données du quota
   * @returns {Promise<Object>}
   */
  async updateQuota(userId, quotaData) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    try {
      const currentQuota = await this.getQuota(userId);

      if (!currentQuota) {
        return await this.createQuota(userId, quotaData.quotaRestant || 50);
      }

      const updateData = {
        'Quota restant': quotaData.quotaRestant !== undefined ? quotaData.quotaRestant : currentQuota.quotaRestant,
        'Dernière mise à jour': new Date().toLocaleDateString('fr-FR'),
        'ID Campagne active': quotaData.idCampagneActive || currentQuota.idCampagneActive || '',
        'Users': [userId]
      };

      const records = await base(QUOTA_TABLE_NAME).update([
        { id: currentQuota.id, fields: updateData }
      ]);

      const record = records[0];
      return {
        id: record.id,
        quotaRestant: record.fields['Quota restant'],
        derniereMiseAJour: record.fields['Dernière mise à jour'],
        idCampagneActive: record.fields['ID Campagne active'],
        userId: record.fields['Users']
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du quota:', error);
      throw new Error(`Erreur lors de la mise à jour du quota: ${error.message}`);
    }
  },

  /**
   * Décrémenter le quota d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} amount - Montant à décrémenter
   * @returns {Promise<Object>}
   */
  async decrementQuota(userId, amount = 1) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    try {
      const currentQuota = await this.getQuota(userId);

      if (!currentQuota) {
        const newQuota = await this.createQuota(userId, 50);
        const decremented = Math.max(0, 50 - amount);
        return await this.updateQuota(userId, {
          quotaRestant: decremented,
          idCampagneActive: ''
        });
      }

      const newQuotaValue = Math.max(0, currentQuota.quotaRestant - amount);

      return await this.updateQuota(userId, {
        quotaRestant: newQuotaValue,
        idCampagneActive: currentQuota.idCampagneActive
      });
    } catch (error) {
      console.error('Erreur lors de la décrémentation du quota:', error);
      throw error;
    }
  },

  /**
   * Réinitialiser le quota quotidien d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {number} newQuota - Nouveau quota
   * @returns {Promise<Object>}
   */
  async resetDailyQuota(userId, newQuota = 50) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    try {
      return await this.updateQuota(userId, {
        quotaRestant: newQuota,
        idCampagneActive: ''
      });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du quota:', error);
      throw error;
    }
  },

  // ========== FONCTIONS UTILITAIRES ==========

  /**
   * Vérifier si un utilisateur peut lancer une campagne
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>}
   */
  async canLaunchCampaign(userId) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    try {
      const [quota, validation] = await Promise.all([
        this.getQuota(userId),
        this.validateConfiguration(userId)
      ]);

      const hasQuota = quota && quota.quotaRestant > 0;
      const hasValidConfig = validation.success && validation.valid;

      return {
        success: true,
        canLaunch: hasQuota && hasValidConfig,
        reasons: {
          quota: hasQuota ? 'OK' : 'Quota épuisé ou non configuré',
          configuration: hasValidConfig ? 'OK' : validation.message
        },
        quotaRestant: quota ? quota.quotaRestant : 0
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des prérequis:', error);
      return {
        success: false,
        canLaunch: false,
        reasons: {
          error: 'Erreur lors de la vérification'
        }
      };
    }
  },

  /**
   * Obtenir le statut complet du système pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>}
   */
  async getSystemStatus(userId) {
    if (!userId) {
      throw new Error('ID utilisateur requis');
    }

    try {
      const [quota, config, validation] = await Promise.all([
        this.getQuota(userId),
        this.getConfiguration(userId),
        this.validateConfiguration(userId)
      ]);

      const hasQuota = quota && quota.quotaRestant > 0;
      const hasConfig = config !== null;

      return {
        success: true,
        data: {
          quota: quota,
          configuration: config,
          validation: validation,
          systemReady: validation.valid && hasQuota
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du statut système:', error);
      throw new Error(`Erreur lors de la récupération du statut système: ${error.message}`);
    }
  },

  /**
   * Générer le message de validation
   * @private
   */
  _getValidationMessage(isValidCookie, isValidEmail, isActive) {
    const issues = [];

    if (!isValidCookie) issues.push('Cookie invalide ou manquant');
    if (!isValidEmail) issues.push('Email invalide ou manquant');
    if (!isActive) issues.push('Configuration inactive');

    return issues.join(', ');
  }
};

module.exports = configurationService;