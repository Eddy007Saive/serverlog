const bcrypt = require('bcrypt');
const { airtableUtils } = require('../config/airtable');

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.username = data.username || data.Username || '';
    this.email = data.email || data.Email || '';
    this.password = data.password || data.Password || '';
    this.googleId = data.googleId  || null;
    this.emailVerified = data.emailVerified ?? false;
    this.role = data.role || data.Role || 'user';
    this.permissions = data.permissions || data.Permissions || [];
    this.isActive = data.isActive ?? data.IsActive ?? true;
    this.lastLogin = data.lastLogin || data.LastLogin || null;
    this.createdTime = data.createdTime || null;
    this.avatar = data.avatar || null;

  }

  validate() {
    const errors = [];
    
    // Username obligatoire
    if (!this.username || this.username.length < 3) {
      errors.push("Le nom d'utilisateur doit contenir au moins 3 caractères");
    }
    
    // Email obligatoire et valide
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Adresse email invalide');
    }
    
    // Mot de passe obligatoire SEULEMENT si pas de Google ID
    if (!this.googleId) {
      if (!this.password || this.password.length < 6) {
        errors.push('Le mot de passe doit contenir au moins 6 caractères');
      }
    }
    
    // Si Google ID existe, le mot de passe peut être vide
    // Mais s'il est fourni, il doit être valide
    if (this.googleId && this.password && this.password.length < 6) {
      errors.push('Si un mot de passe est fourni, il doit contenir au moins 6 caractères');
    }
    
    return errors.length ? errors : null;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async hashPassword() {
    // Ne hasher que si un mot de passe existe et n'est pas déjà hashé
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async verifyPassword(plainPassword) {
    // Si pas de mot de passe (connexion Google uniquement), retourner false
    if (!this.password) {
      return false;
    }
    return bcrypt.compare(plainPassword, this.password);
  }

  // Vérifier si l'utilisateur utilise Google OAuth
  isGoogleUser() {
    return !!this.googleId;
  }

  // Vérifier si l'utilisateur peut se connecter avec mot de passe
  canLoginWithPassword() {
    return !!this.password && this.password.length > 0;
  }

  toAirtableFields() {
    const permissions = Array.isArray(this.permissions)
      ? this.permissions
      : (this.permissions || '').split(',').map(p => p.trim());

    return airtableUtils.filterEmptyFields({
      Username: this.username,
      Email: this.email,
      Password: this.password || '',
      avatar:this.avatar, // Peut être vide pour Google users
      googleId: this.googleId || '',
      emailVerified: this.emailVerified,
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
      googleId: data.googleId,
      avatar: data.avatar,
      emailVerified: data.emailVerified,
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