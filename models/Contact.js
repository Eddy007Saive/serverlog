const { airtableUtils } = require('../config/airtable');

class Contact {
  constructor(data = {}) {
    this.id = data.id || null;
    this.ID_CONTACT = data.ID_CONTACT || data.airtableId || null;
    this.nom = data.nom || data.Nom || '';
    this.image = data.image || data.profilImage || '';
    this.localisation = data.localisation || data.Localisation || '';
    this.posteActuel = data.posteActuel || data['Poste actuel'] || '';
    this.entrepriseActuelle = data.entrepriseActuelle || data['Entreprise actuelle'] || '';
    this.url = data.url || data.URL || '';
    this.statut = data.statut || data.Statut || 'À contacter';
    this.campagne = data.campagne || data.Campagne || '';
    this.campagneId = data.campagneId || '';
    this.secteurs = data.secteurs || data.Secteurs || '';
    this.parcours = data.parcours || data.Parcours || '';
    this.parcoursEducation = data.parcoursEducation || data.ParcoursEducation || '';
    this.messagePersonnalise = data.messagePersonnalise || data['Message Personnalisé'] || '';
    this.connection = data.connection || '';
    this.email = data.email || data.Email || '';
    this.telephone = data.telephone || data.Téléphone || '';
    this.dateMessage = data.dateMessage || data['Date du message'] || null;
    this.reponseRecue = data.reponseRecue || data['Réponse reçue'] || '';
    this.dateReponse = data.dateReponse || data['Date de réponse'] || null;
    this.notes = data.notes || data.Notes || '';
    this.profil = data.profil || data.Profil || 'En attente';
    this.userId = data.userId || data.user_id || [];
    this.createdTime = data.createdTime || null;
  }

  validate() {
    const errors = [];
    
    if (!this.nom || this.nom.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Adresse email invalide');
    }
    
    if (this.url && !this.isValidUrl(this.url)) {
      errors.push('URL invalide');
    }
    
    const validStatuts = [
      'À contacter',
      'Message envoyé',
      'Répondu',
      'Intéressé',
      'Non intéressé',
      'À relancer'
    ];
    if (this.statut && !validStatuts.includes(this.statut)) {
      errors.push('Statut invalide');
    }
    
    const validProfils = ['En attente', 'GARDE', 'REJETE'];
    if (this.profil && !validProfils.includes(this.profil)) {
      errors.push('Profil invalide');
    }
    
    return errors.length ? errors : null;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  toAirtableFields() {
    return airtableUtils.filterEmptyFields({
      'Nom': this.nom,
      'profilImage': this.image,
      'Localisation': this.localisation,
      'Poste actuel': this.posteActuel,
      'Entreprise actuelle': this.entrepriseActuelle,
      'URL': this.url,
      'Statut': this.statut,
      'Campagne': Array.isArray(this.campagneId) ? this.campagneId : [this.campagneId],
      'Secteurs': this.secteurs,
      'Parcours': this.parcours,
      'ParcoursEducation': this.parcoursEducation,
      'Message Personnalisé': this.messagePersonnalise,
      'connection': this.connection,
      'Email': this.email,
      'Téléphone': this.telephone,
      'Date du message': this.dateMessage,
      'Réponse reçue': this.reponseRecue,
      'Date de réponse': this.dateReponse,
      'Notes': this.notes,
      'Profil': this.profil,
      'user_id': Array.isArray(this.userId) ? this.userId : [this.userId]
    });
  }

  static fromAirtableRecord(record) {
    const data = airtableUtils.recordToObject(record);
    const campagneNom = data['Nom de la campagne (from Campagne)'];
    const campagneId = data.Campagne;

    return new Contact({
      id: data.id,
      ID_CONTACT: data.ID_CONTACT || data.id,
      nom: data.Nom,
      image: data.profilImage,
      localisation: data.Localisation,
      posteActuel: data['Poste actuel'],
      entrepriseActuelle: data['Entreprise actuelle'],
      url: data.URL,
      statut: data.Statut,
      campagne: Array.isArray(campagneNom) ? campagneNom[0] : campagneNom,
      campagneId: Array.isArray(campagneId) ? campagneId[0] : campagneId,
      secteurs: data.Secteurs,
      parcours: data.Parcours,
      parcoursEducation: data.ParcoursEducation,
      messagePersonnalise: data['Message Personnalisé'],
      connection: data.connection,
      email: data.Email,
      telephone: data.Téléphone,
      dateMessage: data['Date du message'],
      reponseRecue: data['Réponse reçue'],
      dateReponse: data['Date de réponse'],
      notes: data.Notes,
      profil: data.Profil,
      userId: data.user_id,
      createdTime: data.createdTime
    });
  }

  // Méthodes utilitaires
  isContacted() {
    return this.statut !== 'À contacter';
  }

  hasResponded() {
    return ['Répondu', 'Intéressé', 'Non intéressé'].includes(this.statut);
  }

  isInterested() {
    return this.statut === 'Intéressé';
  }

  isProfileApproved() {
    return this.profil === 'GARDE';
  }

  isProfileRejected() {
    return this.profil === 'REJETE';
  }

  isPending() {
    return this.profil === 'En attente';
  }

  toJSON() {
    return {
      id: this.id,
      ID_CONTACT: this.ID_CONTACT,
      nom: this.nom,
      image: this.image,
      localisation: this.localisation,
      posteActuel: this.posteActuel,
      entrepriseActuelle: this.entrepriseActuelle,
      url: this.url,
      statut: this.statut,
      campagne: this.campagne,
      campagneId: this.campagneId,
      secteurs: this.secteurs,
      parcours: this.parcours,
      parcoursEducation: this.parcoursEducation,
      messagePersonnalise: this.messagePersonnalise,
      connection: this.connection,
      email: this.email,
      telephone: this.telephone,
      dateMessage: this.dateMessage,
      reponseRecue: this.reponseRecue,
      dateReponse: this.dateReponse,
      notes: this.notes,
      profil: this.profil,
      createdTime: this.createdTime
    };
  }
}

module.exports = Contact;