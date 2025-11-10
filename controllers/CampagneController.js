const axios = require('axios');
const Campagne = require('../models/Campagne');
const { airtableUtils } = require('../config/airtable');

// Configuration Airtable
const AIRTABLE_BASE_URL = process.env.AIRTABLE_BASE_URL || `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Campagnes';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'your_api_key';
const headers = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };

// ===========================
// CREATE
// ===========================
exports.createCampagne = async (req, res) => {
  try {
    const campagne = new Campagne(req.body);

    const validationErrors = campagne.validate();
    if (validationErrors) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    const response = await axios.post(
      `${AIRTABLE_BASE_URL}/${AIRTABLE_TABLE_NAME}`,
      { fields: campagne.toAirtableFields() },
      { headers }
    );

    const createdCampagne = Campagne.fromAirtableRecord(response.data);
    res.status(201).json({ success: true, data: createdCampagne });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.response?.data?.error?.message || err.message });
  }
};

// ===========================
// GET ALL
// ===========================
exports.getCampagnes = async (req, res) => {
  try {
    const params = req.query;

    const response = await axios.get(
      `${AIRTABLE_BASE_URL}/${AIRTABLE_TABLE_NAME}`,
      { headers, params }
    );

    const campagnes = response.data.records.map(record => Campagne.fromAirtableRecord(record));
    res.status(200).json({ success: true, data: campagnes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.response?.data?.error?.message || 'Erreur récupération campagnes' });
  }
};

// ===========================
// GET BY ID
// ===========================
exports.getCampagneById = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `${AIRTABLE_BASE_URL}/${AIRTABLE_TABLE_NAME}/${id}`,
      { headers }
    );

    const campagne = Campagne.fromAirtableRecord(response.data);
    res.status(200).json({ success: true, data: campagne });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.response?.data?.error?.message || 'Erreur récupération campagne' });
  }
};

// ===========================
// UPDATE
// ===========================
exports.updateCampagne = async (req, res) => {
  try {
    const { id } = req.params;
    const campagne = new Campagne(req.body);

    const response = await axios.patch(
      `${AIRTABLE_BASE_URL}/${AIRTABLE_TABLE_NAME}/${id}`,
      { fields: campagne.toAirtableFields() },
      { headers }
    );

    const updatedCampagne = Campagne.fromAirtableRecord(response.data);
    res.status(200).json({ success: true, data: updatedCampagne });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.response?.data?.error?.message || 'Erreur mise à jour campagne' });
  }
};

// ===========================
// DELETE
// ===========================
exports.deleteCampagne = async (req, res) => {
  try {
    const { id } = req.params;

    await axios.delete(`${AIRTABLE_BASE_URL}/${AIRTABLE_TABLE_NAME}/${id}`, { headers });

    res.status(200).json({ success: true, message: 'Campagne supprimée avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.response?.data?.error?.message || 'Erreur suppression campagne' });
  }
};

// ===========================
// LAUNCH CAMPAIGN VIA WEBHOOK
// ===========================
exports.lancerCampagne = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la campagne
    const response = await axios.get(`${AIRTABLE_BASE_URL}/${AIRTABLE_TABLE_NAME}/${id}`, { headers });
    const campagne = Campagne.fromAirtableRecord(response.data);

    if (!campagne.lancerCampagne || !campagne.lancerCampagne.url) {
      return res.status(400).json({ success: false, error: 'URL de webhook non trouvée pour cette campagne' });
    }

    // Appel du webhook
    const webhookResponse = await axios.post(campagne.lancerCampagne.url);

    res.status(200).json({
      success: true,
      message: 'Campagne lancée avec succès',
      webhookData: webhookResponse.data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.response?.data?.error?.message || err.message });
  }
};
