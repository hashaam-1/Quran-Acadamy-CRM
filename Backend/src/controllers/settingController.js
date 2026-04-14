const Setting = require('../models/Setting');

// Get all settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    
    // Update all provided fields
    Object.keys(req.body).forEach(key => {
      if (settings[key] !== undefined) {
        settings[key] = req.body[key];
      }
    });
    
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Reset settings to defaults
exports.resetSettings = async (req, res) => {
  try {
    await Setting.deleteMany({});
    const defaultSettings = await Setting.create({});
    res.json(defaultSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
