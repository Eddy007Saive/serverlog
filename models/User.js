const bcrypt = require('bcrypt');
const { airtableUtils } = require('../config/airtable');

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.username = data.username || data.Username || '';
    this.email = data.email || data.Email || '';
    this.password = data.password || data.Password || '';
    this.role = data.role || data.Role || 'user';
    this.permissions = data.permissions || data.Permissions || [];
    this.isActive = data.isActive ?? data.IsActive ?? true;
    this.lastLogin = data.lastLogin || data.LastLogin || null;
    this.createdTime = data.createdTime || null;
  }

  validate() {
    const errors = [];
    if (!this.username || this.username.length < 3)
      errors.push("Le nom d'utilisateur doit contenir au moins 3 caractères");
    if (!this.email || !this.isValidEmail(this.email))
      errors.push('Adresse email invalide');
    if (!this.password || this.password.length < 6)
      errors.push('Le mot de passe doit contenir au moins 6 caractères');
    return errors.length ? errors : null;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async verifyPassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
  }

  toAirtableFields() {
    const permissions = Array.isArray(this.permissions)
      ? this.permissions
      : (this.permissions || '').split(',').map(p => p.trim());

    return airtableUtils.filterEmptyFields({
      Username: this.username,
      Email: this.email,
      Password: this.password,
      Role: this.role,
      Permissions: permissions.join(', '),
      IsActive: this.isActive,
      LastLogin: this.lastLogin
    });
  }

  static fromAirtableRecord(record) {
    const data = airtableUtils.recordToObject(record);
    return new User({
      id: data.id,
      userId: data.userId,
      username: data.Username,
      email: data.Email,
      password: data.Password,
      role: data.Role,
      permissions: data.Permissions
        ? data.Permissions.split(',').map(p => p.trim())
        : [],
      isActive: data.IsActive,
      lastLogin: data.LastLogin,
      createdTime: data.createdTime
    });
  }
}

module.exports = User;
