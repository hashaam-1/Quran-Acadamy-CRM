const Lead = require('../models/Lead.js');

// Get all leads
exports.getLeads = async (req, res) => {
  try {
    const { status, assignedTo } = req.query;
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    
    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    // Map _id to id for frontend compatibility
    const mappedLeads = leads.map(lead => ({
      ...lead.toObject(),
      id: lead._id.toString()
    }));
    
    console.log(`Fetching leads: Found ${mappedLeads.length} leads`);
    res.json(mappedLeads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single lead
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    // Map _id to id for frontend compatibility
    const mappedLead = {
      ...lead.toObject(),
      id: lead._id.toString()
    };
    
    res.json(mappedLead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create lead
exports.createLead = async (req, res) => {
  try {
    const lead = new Lead(req.body);
    const newLead = await lead.save();
    
    // Map _id to id for frontend compatibility
    const mappedLead = {
      ...newLead.toObject(),
      id: newLead._id.toString()
    };
    
    res.status(201).json(mappedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update lead
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    // Map _id to id for frontend compatibility
    const mappedLead = {
      ...lead.toObject(),
      id: lead._id.toString()
    };
    
    res.json(mappedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete lead
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add call log to lead
exports.addCallLog = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    lead.callLogs.push(req.body);
    await lead.save();
    
    // Map _id to id for frontend compatibility
    const mappedLead = {
      ...lead.toObject(),
      id: lead._id.toString()
    };
    
    res.json(mappedLead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get leads statistics
exports.getLeadsStats = async (req, res) => {
  try {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await Lead.countDocuments();
    
    res.json({
      total,
      byStatus: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
