// models/User.js
const { base, airtableConfig, airtableUtils } = require('../config/airtable');
const bcrypt = require('bcrypt');

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || data.Username || '';
    this.email = data.email || data.Email || '';
    this.password = data.password || data.Password || '';
    this.role = data.role || data.Role || 'user';
    this.permissions = data.permissions || data.Permissions || [];
    this.isActive = data.isActive !== undefined ? data.isActive : (data.IsActive || true);
    this.lastLogin = data.lastLogin || data.LastLogin || null;
    this.createdTime = data.createdTime || null;
  }

  // Valider les données utilisateur
  validate() {
    const errors = [];
    
    if (!this.username || this.username.length < 3) {
      errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    }
    
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Adresse email invalide');
    }
    
    if (!this.password || this.password.length < 6) {
      errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }
    
    return errors.length === 0 ? null : errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Hasher le mot de passe
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Vérifier le mot de passe
  async verifyPassword(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
  }

  // Convertir en objet pour Airtable (noms de champs Airtable)
  toAirtableFields() {
    const permissions = Array.isArray(this.permissions) 
      ? this.permissions 
      : (this.permissions ? this.permissions.split(',').map(p => p.trim()) : []);

    return airtableUtils.filterEmptyFields({
      'Username': this.username,
      'Email': this.email,
      'Password': this.password,
      'Role': this.role,
      'Permissions': permissions.join(', '),
      'IsActive': this.isActive,
      'LastLogin': this.lastLogin
    });
  }

  // Convertir depuis un record Airtable
  static fromAirtableRecord(record) {
    const data = airtableUtils.recordToObject(record);
    return new User({
      id: data.id,
      username: data.Username,
      email: data.Email,
      password: data.Password,
      role: data.Role,
      permissions: data.Permissions ? data.Permissions.split(',').map(p => p.trim()) : [],
      isActive: data.IsActive,
      lastLogin: data.LastLogin,
      createdTime: data.createdTime
    });
  }

  // Créer un utilisateur
  static async create(userData) {
    try {
      const user = new User(userData);
      
      // Valider les données
      const validationErrors = user.validate();
      if (validationErrors) {
        throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findByEmail(user.email) || await User.findByUsername(user.username);
      if (existingUser) {
        throw new Error('Un utilisateur avec ce nom d\'utilisateur ou cet email existe déjà');
      }

      // Hasher le mot de passe
      await user.hashPassword();

      // Créer dans Airtable
      const records = await base(airtableConfig.tables.users).create([
        { fields: user.toAirtableFields() }
      ]);

      return User.fromAirtableRecord(records[0]);
    } catch (error) {
      const airtableError = airtableUtils.handleAirtableError(error);
      throw new Error(`Erreur lors de la création: ${airtableError.message}`);
    }
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    try {
      const record = await base(airtableConfig.tables.users).find(id);
      return User.fromAirtableRecord(record);
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      const airtableError = airtableUtils.handleAirtableError(error);
      throw new Error(`Erreur lors de la recherche: ${airtableError.message}`);
    }
  }

  // Trouver un utilisateur par nom d'utilisateur
  static async findByUsername(username) {
    try {
      const records = await base(airtableConfig.tables.users)
        .select({
          filterByFormula: `{Username} = '${username}'`,
          maxRecords: 1
        })
        .firstPage();

      return records.length > 0 ? User.fromAirtableRecord(records[0]) : null;
    } catch (error) {
      const airtableError = airtableUtils.handleAirtableError(error);
      throw new Error(`Erreur lors de la recherche: ${airtableError.message}`);
    }
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    try {
      const records = await base(airtableConfig.tables.users)
        .select({
          filterByFormula: `{Email} = '${email}'`,
          maxRecords: 1
        })
        .firstPage();

      return records.length > 0 ? User.fromAirtableRecord(records[0]) : null;
    } catch (error) {
      const airtableError = airtableUtils.handleAirtableError(error);
      throw new Error(`Erreur lors de la recherche: ${airtableError.message}`);
    }
  }

  // Obtenir tous les utilisateurs
  static async findAll(options = {}) {
    try {
      const { maxRecords = 100, filterByFormula = '', sort = [] } = options;
      
      const selectOptions = {
        maxRecords,
        sort: sort.length > 0 ? sort : [{ field: 'Username', direction: 'asc' }]
      };

      if (filterByFormula) {
        selectOptions.filterByFormula = filterByFormula;
      }

      const records = await base(airtableConfig.tables.users)
        .select(selectOptions)
        .all();

      return records.map(record => User.fromAirtableRecord(record));
    } catch (error) {
      const airtableError = airtableUtils.handleAirtableError(error);
      throw new Error(`Erreur lors de la recherche: ${airtableError.message}`);
    }
  }

  // Mettre à jour un utilisateur
  async update(updateData = {}) {
    try {
      if (!this.id) {
        throw new Error('ID utilisateur requis pour la mise à jour');
      }

      // Mettre à jour les propriétés locales
      Object.keys(updateData).forEach(key => {
        if (this.hasOwnProperty(key)) {
          this[key] = updateData[key];
        }
      });

      // Hasher le mot de passe si modifié
      if (updateData.password) {
        await this.hashPassword();
      }

      // Mettre à jour dans Airtable
      const records = await base(airtableConfig.tables.users).update([
        {
          id: this.id,
          fields: this.toAirtableFields()
        }
      ]);

      return User.fromAirtableRecord(records[0]);
    } catch (error) {
      const airtableError = airtableUtils.handleAirtableError(error);
      throw new Error(`Erreur lors de la mise à jour: ${airtableError.message}`);
    }
  }

  // Supprimer un utilisateur
  async delete() {
    try {
      if (!this.id) {
        throw new Error('ID utilisateur requis pour la suppression');
      }

      await base(airtableConfig.tables.users).destroy([this.id]);
      return true;
    } catch (error) {
      const airtableError = airtableUtils.handleAirtableError(error);
      throw new Error(`Erreur lors de la suppression: ${airtableError.message}`);
    }
  }

  // Mettre à jour le dernier login
  async updateLastLogin() {
    try {
      this.lastLogin = new Date().toISOString();
      
      await base(airtableConfig.tables.users).update([
        {
          id: this.id,
          fields: { 'LastLogin': this.lastLogin }
        }
      ]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dernier login:', error);
      // Ne pas faire échouer la connexion pour cette erreur non-critique
    }
  }
}

module.exports = User;