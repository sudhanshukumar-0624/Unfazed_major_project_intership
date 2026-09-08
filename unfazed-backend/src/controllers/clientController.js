const Client = require('../models/Client');
const entitlementService = require('../services/entitlementService');

// @desc    Get all clients for therapist
// @route   GET /api/clients
// @access  Private
const getClients = async (req, res) => {
  try {
    const { status, search, tag } = req.query;
    const filter = { therapist_id: req.therapist._id };

    if (status) filter.status = status;
    if (tag) filter.tags = tag;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(filter).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
const getClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      therapist_id: req.therapist._id,
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
const createClient = async (req, res) => {
  try {
    // Check active client cap via entitlement service
    const canAdd = await entitlementService.canAccess(req.therapist._id, 'activeClientCap');
    if (!canAdd) {
      return res.status(403).json({
        message: 'Active client limit reached for your plan. Please upgrade.',
        upgradeRequired: true,
      });
    }

    const { name, email, phone, age, gender, tags, presentingConcern } = req.body;
    const client = await Client.create({
      therapist_id: req.therapist._id,
      name,
      email,
      phone,
      age,
      gender,
      tags,
      presentingConcern,
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, therapist_id: req.therapist._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      therapist_id: req.therapist._id,
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit intake form + consent (client-facing)
// @route   POST /api/clients/:id/intake
// @access  Public (via client portal)
const submitIntake = async (req, res) => {
  try {
    const { intakeData, consentGiven } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    client.intakeData = intakeData || {};
    if (consentGiven) {
      client.consentGiven = true;
      client.consentTimestamp = new Date();
    }
    await client.save();
    res.json({ message: 'Intake submitted successfully', client });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient, submitIntake };
