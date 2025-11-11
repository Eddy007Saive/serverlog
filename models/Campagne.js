const { airtableUtils } = require('../config/airtable');

class Campagne {
constructor(data = {}) {
  this.id = data.id || null;
  this.ID = data.ID || null;
  
  // ✅ Priorité aux clés Airtable
  this.nom = data['Nom de la campagne'] || data.nom || '';
  this.poste = data['Poste recherché'] || data.poste || '';
  this.zone = data['Zone géographique'] || data.zone || '';
  this.seniorite = data['Seniorite'] || data.seniorite || '';
  this.tailleEntreprise = data['Taille_entreprise'] || data.tailleEntreprise || '';
  this.langues = data['Langues parlées'] || data.langues || '';
  this.secteurs = data['Secteurs souhaités'] || data.secteurs || '';
  this.dateCreation = data['Date de création'] || data.dateCreation || '';
  this.contacts = data['Contacts'] || data.contacts || [];
  this.statut = data['Statut'] || data.statut || 'Actif';
  this.lancerCampagne = data['Lancer Campagne'] || data.lancerCampagne || null;
  this.Template_message = data['Template_message'] || data.Template_message || '';
  this.enrichissement = data["Statut d'enrichissement"] || data.enrichissement || 'En attente';
  this.jours_enrichissement = data['Jours_enrichissement'] || data.jours_enrichissement || '';
  this.profileParJours = data['Profils/jour'] || data.profileParJours || 0;  // ✅ Inversé !
  this.messageParJours = data['Messages/jour'] || data.messageParJours || 0;  // ✅ Inversé !
  this.InstructionRelance4Jours = data['InstructionRelance4Jours'] || data.InstructionRelance4Jours || '';
  this.InstructionRelance7Jours = data['InstructionRelance7Jours'] || data.InstructionRelance7Jours || '';
  this.InstructionRelance14Jours = data['InstructionRelance14Jours'] || data.InstructionRelance14Jours || '';
  this.user_id = data.user_id || [];
  this.Users = data.Users;
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
      'Contacts': this.contacts,
      'Statut': this.statut,
      'Template_message': this.Template_message,
      "Statut d'enrichissement": this.enrichissement,
      'Jours_enrichissement': this.jours_enrichissement,
      'Profils/jour': this.profileParJours,
      'Messages/jour': this.messageParJours,
      'InstructionRelance4Jours': this.InstructionRelance4Jours,
      'InstructionRelance7Jours': this.InstructionRelance7Jours,
      'InstructionRelance14Jours': this.InstructionRelance14Jours,
      "Users":this.Users
    });
  }

static fromAirtableRecord(record) {
  const data = airtableUtils.recordToObject(record);
  
  // ✅ Passer directement les données Airtable, le constructeur fera le mapping
  return new Campagne({
    id: data.id,
    ID: data.ID,
    'Nom de la campagne': data['Nom de la campagne'],
    'Poste recherché': data['Poste recherché'],
    'Zone géographique': data['Zone géographique'],
    'Seniorite': data['Seniorite'],
    'Taille_entreprise': data['Taille_entreprise'],
    'Langues parlées': data['Langues parlées'],
    'Secteurs souhaités': data['Secteurs souhaités'],
    'Date de création': data['Date de création'],
    'Contacts': data['Contacts'],
    'Statut': data['Statut'],
    'Lancer Campagne': data['Lancer Campagne'],
    'Template_message': data['Template_message'],
    "Statut d'enrichissement": data["Statut d'enrichissement"],
    'Jours_enrichissement': data['Jours_enrichissement'],
    'Profils/jour': data['Profils/jour'],
    'Messages/jour': data['Messages/jour'],
    'InstructionRelance4Jours': data['InstructionRelance4Jours'],
    'InstructionRelance7Jours': data['InstructionRelance7Jours'],
    'InstructionRelance14Jours': data['InstructionRelance14Jours'],
    'user_id': data['user_id'],
    'Users': data['Users']
  });
}
}

module.exports = Campagne;
