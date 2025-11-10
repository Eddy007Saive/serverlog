const { airtableUtils } = require('../config/airtable');

class Campagne {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nom = data.nom || data['Nom de la campagne'] || '';
    this.poste = data.poste || data['Poste recherché'] || '';
    this.zone = data.zone || data['Zone géographique'] || '';
    this.seniorite = data.seniorite || data['Seniorite'] || '';
    this.tailleEntreprise = data.tailleEntreprise || data['Taille_entreprise'] || '';
    this.langues = data.langues || data['Langues parlées'] || '';
    this.secteurs = data.secteurs || data['Secteurs souhaités'] || '';
    this.dateCreation = data.dateCreation || data['Date de création'] || '';
    this.contacts = data.contacts || data['Contacts'] || [];
    this.statut = data.statut || data['Statut'] || 'Actif';
    this.lancerCampagne = data.lancerCampagne || data['Lancer Campagne'] || null;
    this.Template_message = data.Template_message || data['Template_message'] || '';
    this.enrichissement = data.enrichissement || data["Statut d'enrichissement"] || 'En attente';
    this.jours_enrichissement = data.jours_enrichissement || data['Jours_enrichissement'] || '';
    this.profileParJours = data.profileParJours || data['Profils/jour'] || 0;
    this.messageParJours = data.messageParJours || data['Messages/jour'] || 0;
    this.InstructionRelance4Jours = data.InstructionRelance4Jours || data['InstructionRelance4Jours'] || '';
    this.InstructionRelance7Jours = data.InstructionRelance7Jours || data['InstructionRelance7Jours'] || '';
    this.InstructionRelance14Jours = data.InstructionRelance14Jours || data['InstructionRelance14Jours'] || '';
    this.user_id = data.user_id || [];
  }

  validate() {
    const errors = [];
    if (!this.nom || this.nom.length < 3)
      errors.push("Le nom de la campagne doit contenir au moins 3 caractères");
    if (!this.poste || this.poste.length < 2)
      errors.push("Le poste recherché est invalide");
    return errors.length ? errors : null;
  }

  toAirtableFields() {
    return airtableUtils.filterEmptyFields({
      'Nom de la campagne': this.nom,
      'Poste recherché': this.poste,
      'Zone géographique': this.zone,
      'Seniorite': this.seniorite,
      'Taille_entreprise': this.tailleEntreprise,
      'Langues parlées': this.langues,
      'Secteurs souhaités': this.secteurs,
      'Date de création': this.dateCreation,
      'Contacts': this.contacts,
      'Statut': this.statut,
      'Lancer Campagne': this.lancerCampagne,
      'Template_message': this.Template_message,
      "Statut d'enrichissement": this.enrichissement,
      'Jours_enrichissement': this.jours_enrichissement,
      'Profils/jour': this.profileParJours,
      'Messages/jour': this.messageParJours,
      'InstructionRelance4Jours': this.InstructionRelance4Jours,
      'InstructionRelance7Jours': this.InstructionRelance7Jours,
      'InstructionRelance14Jours': this.InstructionRelance14Jours,
      'user_id': this.user_id
    });
  }

  static fromAirtableRecord(record) {
    const data = airtableUtils.recordToObject(record);
    return new Campagne({
      id: data.id,
      nom: data['Nom de la campagne'],
      poste: data['Poste recherché'],
      zone: data['Zone géographique'],
      seniorite: data['Seniorite'],
      tailleEntreprise: data['Taille_entreprise'],
      langues: data['Langues parlées'],
      secteurs: data['Secteurs souhaités'],
      dateCreation: data['Date de création'],
      contacts: data['Contacts'],
      statut: data['Statut'],
      lancerCampagne: data['Lancer Campagne'],
      Template_message: data['Template_message'],
      enrichissement: data["Statut d'enrichissement"],
      jours_enrichissement: data['Jours_enrichissement'],
      profileParJours: data['Profils/jour'],
      messageParJours: data['Messages/jour'],
      InstructionRelance4Jours: data['InstructionRelance4Jours'],
      InstructionRelance7Jours: data['InstructionRelance7Jours'],
      InstructionRelance14Jours: data['InstructionRelance14Jours'],
      user_id: data['user_id']
    });
  }
}

module.exports = Campagne;
