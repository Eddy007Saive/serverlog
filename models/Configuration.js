const { airtableUtils } = require('../config/airtable');

class Configuration {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nom = data.nom || data.Nom || 'LinkedIn Cookies';
    this.valeur = data.valeur || data.Valeur || data.liAt || '';
    this.email = data.email || data.Email || '';
    this.derniereMiseAJour = data.derniereMiseAJour || data['Dernière mise à jour'] || null;
    this.status = data.status || data.Status || 'Inactif';
    this.userAgent = data.userAgent || data.User_agent || '';
    this.userId = data.userId || data.user_id || data.Users || [];
    this.createdTime = data.createdTime || null;

  }

  /**
   * Valider la configuration
   * @returns {Array|null} - Liste des erreurs ou null si valide
   */
  validate() {
    const errors = [];

    // Validation du nom
    if (!this.nom || this.nom.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    // Validation du cookie li_at
    if (this.valeur) {
      if (this.valeur.length < 50) {
        errors.push('Le cookie li_at doit contenir au moins 50 caractères');
      }
      if (!this.valeur.startsWith('AQEDA')) {
        errors.push('Le cookie li_at doit commencer par "AQEDA"');
      }
    }

    // Validation de l'email
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Adresse email invalide');
    }

    // Validation du statut
    const validStatuts = ['Actif', 'Inactif'];
    if (this.status && !validStatuts.includes(this.status)) {
      errors.push('Statut invalide (Actif ou Inactif)');
    }

    // Validation du User-Agent
    if (this.userAgent) {
      if (this.userAgent.length < 50) {
        errors.push('Le User-Agent doit contenir au moins 50 caractères');
      }
      if (!this.userAgent.includes('Mozilla')) {
        errors.push('Le User-Agent doit être un User-Agent de navigateur valide');
      }
    }

    return errors.length ? errors : null;
  }

  /**
   * Vérifier si l'email est valide
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Vérifier si le cookie est valide
   * @returns {boolean}
   */
  isValidCookie() {
    return this.valeur && 
           this.valeur.length > 50 && 
           this.valeur.startsWith('AQEDA');
  }

  /**
   * Vérifier si la configuration est active
   * @returns {boolean}
   */
  isActive() {
    return this.status === 'Actif';
  }

  /**
   * Vérifier si la configuration est complète et valide
   * @returns {boolean}
   */
  isFullyValid() {
    return this.isValidCookie() && 
           this.email && 
           this.isValidEmail(this.email) && 
           this.isActive() &&
           this.userAgent && 
           this.userAgent.length > 50;
  }

  /**
   * Convertir en champs Airtable
   * @returns {Object}
   */
  toAirtableFields() {
    return airtableUtils.filterEmptyFields({
      'Nom': this.nom,
      'Valeur': this.valeur,
      'Email': this.email,
      'Status': this.status,
      'User_agent': this.userAgent,
      'Users': Array.isArray(this.userId) ? this.userId : [this.userId]
    });
  }

  /**
   * Créer une instance depuis un enregistrement Airtable
   * @param {Object} record - Enregistrement Airtable
   * @returns {Configuration}
   */
  static fromAirtableRecord(record) {
    const data = airtableUtils.recordToObject(record);

    return new Configuration({
      id: data.id,
      nom: data.Nom,
      valeur: data.Valeur,
      email: data.Email,
      derniereMiseAJour: data['Dernière mise à jour'],
      status: data.Status,
      userAgent: data.User_agent,
      userId: data.Users,
      createdTime: data.createdTime
    });
  }

  /**
   * Obtenir le statut de validation détaillé
   * @returns {Object}
   */
  getValidationStatus() {
    return {
      cookieValid: this.isValidCookie(),
      emailValid: this.email && this.isValidEmail(this.email),
      userAgentValid: this.userAgent && this.userAgent.length > 50 && this.userAgent.includes('Mozilla'),
      statusActive: this.isActive(),
      fullyValid: this.isFullyValid(),
      cookieLength: this.valeur ? this.valeur.length : 0,
      userAgentLength: this.userAgent ? this.userAgent.length : 0
    };
  }

  /**
   * Obtenir un message de validation lisible
   * @returns {string}
   */
  getValidationMessage() {
    const issues = [];

    if (!this.isValidCookie()) {
      issues.push('Cookie LinkedIn invalide ou manquant');
    }
    if (!this.email || !this.isValidEmail(this.email)) {
      issues.push('Email invalide ou manquant');
    }
    if (!this.userAgent || this.userAgent.length < 50) {
      issues.push('User-Agent invalide ou manquant');
    }
    if (!this.isActive()) {
      issues.push('Configuration inactive');
    }

    return issues.length ? issues.join(', ') : 'Configuration valide';
  }

  /**
   * Masquer les données sensibles pour l'affichage
   * @returns {Object}
   */
  toSafeJSON() {
    return {
      id: this.id,
      nom: this.nom,
      email: this.email,
      derniereMiseAJour: this.derniereMiseAJour,
      status: this.status,
      cookieValid: this.isValidCookie(),
      userAgentValid: this.userAgent && this.userAgent.length > 50,
      fullyValid: this.isFullyValid(),
      createdTime: this.createdTime
    };
  }

  /**
   * Convertir en JSON complet
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nom: this.nom,
      valeur: this.valeur,
      email: this.email,
      derniereMiseAJour: this.derniereMiseAJour,
      status: this.status,
      userAgent: this.userAgent,
      userId: this.userId,
      createdTime: this.createdTime
    };
  }

  /**
   * Mettre à jour la date de mise à jour
   */
  updateTimestamp() {
    this.derniereMiseAJour = new Date().toLocaleDateString('fr-FR');
  }

  /**
   * Activer la configuration
   */
  activate() {
    this.status = 'Actif';
    this.updateTimestamp();
  }

  /**
   * Désactiver la configuration
   */
  deactivate() {
    this.status = 'Inactif';
    this.updateTimestamp();
  }
}

module.exports = Configuration;