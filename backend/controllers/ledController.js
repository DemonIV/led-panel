const LedModel = require('../models/ledModel');

const getAllLeds = async (req, res) => {
  try {
    const leds = await LedModel.getAll();
    res.json(leds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createLed = async (req, res) => {
  try {
    const result = await LedModel.create(req.body);
    res.status(201).json({ id: result.insertId, message: 'LED created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateLed = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await LedModel.update(id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'LED not found' });
    }
    res.json({ message: 'LED updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteLed = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await LedModel.delete(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'LED not found' });
    }
    res.json({ message: 'LED deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllLeds, createLed, updateLed, deleteLed };