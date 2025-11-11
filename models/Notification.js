const { airtableUtils } = require('../config/airtable');

class Notification {
  constructor(data = {}) {
    this.id = data.id || null;
    this.workfow = data.workfow || data.workflow || '';
    this.status = data.status || 'info';
    this.message = data.message || '';
    this.data = data.data || '';
    this.type = data.type || data.Type || '';
    this.read = data.read || data.Read || false;
    this.createdAt = data.createdAt || data.created_at || null;
  }

  validate() {
    const errors = [];
    
    if (!this.message || this.message.trim().length === 0) {
      errors.push('Le message ne peut pas être vide');
    }
    
    const validStatuses = ['success', 'warning', 'error', 'info'];
    if (this.status && !validStatuses.includes(this.status)) {
      errors.push('Statut invalide. Doit être: success, warning, error ou info');
    }
    
    if (typeof this.read !== 'boolean') {
      errors.push('Le champ read doit être un booléen');
    }
    
    return errors.length ? errors : null;
  }

  toAirtableFields() {
    return airtableUtils.filterEmptyFields({
      'workfow': this.workfow,
      'status': this.status,
      'message': this.message,
      'data': typeof this.data === 'object' ? JSON.stringify(this.data) : this.data,
      'Type': this.type,
      'Read': this.read,
      'created_at': this.createdAt || new Date().toISOString()
    });
  }

  static fromAirtableRecord(record) {
    const data = airtableUtils.recordToObject(record);

    return new Notification({
      id: data.id,
      workfow: data.workfow || '',
      status: data.status || 'info',
      message: data.message || '',
      data: data.data || '',
      type: data.Type || '',
      read: data.Read || false,
      createdAt: data.created_at
    });
  }

  // Méthodes utilitaires
  isRead() {
    return this.read === true;
  }

  isUnread() {
    return this.read === false;
  }

  isSuccess() {
    return this.status === 'success';
  }

  isWarning() {
    return this.status === 'warning';
  }

  isError() {
    return this.status === 'error';
  }

  isInfo() {
    return this.status === 'info';
  }

  markAsRead() {
    this.read = true;
  }

  markAsUnread() {
    this.read = false;
  }

  // Vérifier si la notification est récente (moins de 24h)
  isRecent() {
    if (!this.createdAt) return false;
    const notificationDate = new Date(this.createdAt);
    const now = new Date();
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60);
    return diffInHours < 24;
  }

  // Obtenir l'âge de la notification en format lisible
  getAge() {
    if (!this.createdAt) return 'Date inconnue';
    
    const notificationDate = new Date(this.createdAt);
    const now = new Date();
    const diffInMs = now - notificationDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    
    return notificationDate.toLocaleDateString('fr-FR');
  }

  // Parser les données JSON si elles existent
  getParsedData() {
    if (!this.data) return null;
    
    try {
      return typeof this.data === 'string' ? JSON.parse(this.data) : this.data;
    } catch (error) {
      console.error('Erreur lors du parsing des données:', error);
      return this.data;
    }
  }

  toJSON() {
    return {
      id: this.id,
      workfow: this.workfow,
      status: this.status,
      message: this.message,
      data: this.data,
      type: this.type,
      read: this.read,
      createdAt: this.createdAt
    };
  }
}

module.exports = Notification;