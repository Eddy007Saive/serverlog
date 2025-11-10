const { base, airtableConfig, airtableUtils } = require('../config/airtable');
const User = require('../models/User');

const userService = {
  async createUser(userData) {
    const user = new User(userData);

    const validationErrors = user.validate();
    if (validationErrors) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }

    // Vérifie si un utilisateur existe déjà
    const existingUser = await this.findByEmail(user.email)
      || await this.findByUsername(user.username);
    if (existingUser) {
      throw new Error("Un utilisateur avec cet email ou nom d'utilisateur existe déjà");
    }

    await user.hashPassword();

    const records = await base(airtableConfig.tables.users).create([
      { fields: user.toAirtableFields() }
    ]);

    return User.fromAirtableRecord(records[0]);
  },

  async findById(id) {
    try {
      const record = await base(airtableConfig.tables.users).find(id);
      return User.fromAirtableRecord(record);
    } catch (error) {
      if (error.statusCode === 404) return null;
      throw new Error(`Erreur lors de la recherche par ID: ${error.message}`);
    }
  },

  async findByUsername(username) {
    const records = await base(airtableConfig.tables.users)
      .select({
        filterByFormula: `{Username} = '${username}'`,
        maxRecords: 1
      })
      .firstPage();

    return records.length ? User.fromAirtableRecord(records[0]) : null;
  },

  async findByEmail(email) {
    const records = await base(airtableConfig.tables.users)
      .select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
      })
      .firstPage();

    return records.length ? User.fromAirtableRecord(records[0]) : null;
  },

  async updateUser(id, updateData) {
    const existing = await this.findById(id);
    if (!existing) throw new Error("Utilisateur introuvable");

    Object.assign(existing, updateData);
    if (updateData.password) await existing.hashPassword();

    const records = await base(airtableConfig.tables.users).update([
      { id, fields: existing.toAirtableFields() }
    ]);

    return User.fromAirtableRecord(records[0]);
  },

  async deleteUser(id) {
    await base(airtableConfig.tables.users).destroy([id]);
    return true;
  },

  async findAll(options = {}) {
    const { maxRecords = 100, filterByFormula = '', sort = [] } = options;
    const selectOptions = {
      maxRecords,
      sort: sort.length ? sort : [{ field: 'Username', direction: 'asc' }],
    };
    if (filterByFormula) selectOptions.filterByFormula = filterByFormula;

    const records = await base(airtableConfig.tables.users)
      .select(selectOptions)
      .all();

    return records.map(r => User.fromAirtableRecord(r));
  }
};

module.exports = userService;
