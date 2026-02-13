const express = require('express');
const User = require('../models/User');
const Report = require('../models/Report');
const { authenticate, requireRole } = require('../middleware/auth');
const { buildTrendsFromUserId } = require('../services/trendService');

const router = express.Router();

// Get patient reports by patientId
router.get('/patient/:patientId/reports', authenticate, requireRole('DOCTOR'), async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Find patient by patientId
    const patient = await User.findOne({ patientId, role: 'PATIENT' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Fetch ALL reports for patient using userId
    const reports = await Report.find({ userId: patient._id }).sort({ createdAt: -1 });
    
    res.json({
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        patientId: patient.patientId
      },
      reports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient trends by patientId - USES SAME SHARED BUILDER AS PATIENT ENDPOINT
router.get('/patient/:patientId/trends', authenticate, requireRole('DOCTOR'), async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Find patient by patientId
    const patient = await User.findOne({ patientId, role: 'PATIENT' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Use SAME SHARED trend builder as patient endpoint
    const trends = await buildTrendsFromUserId(patient._id);
    
    res.json({
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        patientId: patient.patientId
      },
      trends
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
