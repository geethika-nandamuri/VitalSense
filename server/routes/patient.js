const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { authenticate, requireRole } = require('../middleware/auth');
const { buildTrendsFromUserId } = require('../services/trendService');

const router = express.Router();

// Get patient profile
router.get('/profile', authenticate, requireRole('PATIENT'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        name: req.user.name,
        patientId: req.user.patientId,
        email: req.user.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient appointments
router.get('/appointments', authenticate, requireRole('PATIENT'), async (req, res) => {
  try {
    console.log('FETCHING APPOINTMENTS FOR patientId:', req.user._id);
    
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate('doctorId', 'name email doctorId doctorProfile')
      .sort({ date: -1, createdAt: -1 });
    
    console.log('FOUND APPOINTMENTS:', appointments.length);
    
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('FETCH APPOINTMENTS ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient trends - USES SHARED TREND BUILDER
router.get('/trends', authenticate, requireRole('PATIENT'), async (req, res) => {
  try {
    // Use SHARED trend builder
    const trends = await buildTrendsFromUserId(req.user._id);
    
    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all registered doctors
router.get('/doctors', authenticate, requireRole('PATIENT'), async (req, res) => {
  try {
    const doctors = await User.find({ role: 'DOCTOR' })
      .select('name email doctorId doctorProfile._id')
      .lean();
    
    res.json({
      success: true,
      doctors: doctors.map(doc => ({
        _id: doc._id,
        name: doc.name,
        email: doc.email,
        doctorId: doc.doctorId,
        specialization: doc.doctorProfile?.specialization,
        hospital: doc.doctorProfile?.hospital,
        experienceYears: doc.doctorProfile?.experienceYears
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
