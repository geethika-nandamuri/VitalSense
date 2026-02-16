const express = require('express');
const User = require('../models/User');
const Report = require('../models/Report');
const Appointment = require('../models/Appointment');
const { authenticate, requireRole } = require('../middleware/auth');
const { buildTrendsFromUserId } = require('../services/trendService');

const router = express.Router();

// Get all registered doctors (public endpoint for appointment booking)
router.get('/list', async (req, res) => {
  try {
    const { city, hospitalName, specialization } = req.query;
    
    const query = { role: 'DOCTOR', 'doctorProfile.specialization': { $exists: true, $ne: null } };
    
    if (city) query['doctorProfile.city'] = city;
    if (hospitalName) query['doctorProfile.hospitalName'] = hospitalName;
    if (specialization) query['doctorProfile.specialization'] = specialization;
    
    const doctors = await User.find(query).select('name doctorId doctorProfile');
    
    const formattedDoctors = doctors.map(doc => ({
      _id: doc._id,
      doctorId: doc.doctorId,
      name: doc.name,
      city: doc.doctorProfile?.city,
      hospitalName: doc.doctorProfile?.hospitalName,
      specialization: doc.doctorProfile?.specialization,
      experienceYears: doc.doctorProfile?.experienceYears,
      consultationFee: doc.doctorProfile?.consultationFee,
      timeWindow: doc.doctorProfile?.timeWindow
    }));
    
    res.json({ success: true, data: formattedDoctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unique cities from registered doctors
router.get('/cities', async (req, res) => {
  try {
    const cities = await User.distinct('doctorProfile.city', { 
      role: 'DOCTOR', 
      'doctorProfile.city': { $exists: true, $ne: null } 
    });
    res.json({ success: true, data: cities.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unique hospitals by city
router.get('/hospitals', async (req, res) => {
  try {
    const { city } = req.query;
    const query = { role: 'DOCTOR', 'doctorProfile.hospitalName': { $exists: true, $ne: null } };
    if (city) query['doctorProfile.city'] = city;
    
    const hospitals = await User.distinct('doctorProfile.hospitalName', query);
    res.json({ success: true, data: hospitals.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unique specializations by city and hospital
router.get('/specializations', async (req, res) => {
  try {
    const { city, hospitalName } = req.query;
    const query = { role: 'DOCTOR', 'doctorProfile.specialization': { $exists: true, $ne: null } };
    if (city) query['doctorProfile.city'] = city;
    if (hospitalName) query['doctorProfile.hospitalName'] = hospitalName;
    
    const specializations = await User.distinct('doctorProfile.specialization', query);
    res.json({ success: true, data: specializations.filter(Boolean).sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get doctor profile
router.get('/profile', authenticate, requireRole('DOCTOR'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        name: req.user.name,
        doctorId: req.user.doctorId,
        email: req.user.email,
        phone: req.user.doctorProfile?.phone,
        city: req.user.doctorProfile?.city,
        hospitalName: req.user.doctorProfile?.hospitalName,
        specialization: req.user.doctorProfile?.specialization,
        experienceYears: req.user.doctorProfile?.experienceYears,
        consultationFee: req.user.doctorProfile?.consultationFee,
        maxPatientsPerSlot: req.user.doctorProfile?.maxPatientsPerSlot,
        timeWindow: req.user.doctorProfile?.timeWindow
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update doctor profile
router.put('/profile', authenticate, requireRole('DOCTOR'), async (req, res) => {
  try {
    const { phone, city, hospitalName, specialization, experienceYears, consultationFee, maxPatientsPerSlot, timeWindow } = req.body;
    
    req.user.doctorProfile = {
      phone,
      city,
      hospitalName,
      specialization,
      experienceYears,
      consultationFee,
      maxPatientsPerSlot,
      timeWindow,
      profileCompleted: true
    };
    
    await req.user.save();
    
    res.json({
      success: true,
      data: {
        name: req.user.name,
        doctorId: req.user.doctorId,
        email: req.user.email,
        phone: req.user.doctorProfile.phone,
        city: req.user.doctorProfile.city,
        hospitalName: req.user.doctorProfile.hospitalName,
        specialization: req.user.doctorProfile.specialization,
        experienceYears: req.user.doctorProfile.experienceYears,
        consultationFee: req.user.doctorProfile.consultationFee,
        maxPatientsPerSlot: req.user.doctorProfile.maxPatientsPerSlot,
        timeWindow: req.user.doctorProfile.timeWindow,
        profileCompleted: req.user.doctorProfile.profileCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get doctor appointments
router.get('/appointments', authenticate, requireRole('DOCTOR'), async (req, res) => {
  try {
    const { date } = req.query;
    
    console.log('\n=== DOCTOR APPOINTMENTS REQUEST ===');
    console.log('Doctor ID (req.user._id):', req.user._id);
    console.log('Doctor Email:', req.user.email);
    console.log('Query Date:', date);
    
    let query = { doctorId: req.user._id };
    
    // If date provided, filter by that specific date
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
      console.log('Date Range:', { start, end });
    }
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email patientId phoneNumber')
      .sort({ date: -1, time: 1 });
    
    console.log('Found Appointments:', appointments.length);
    if (appointments.length > 0) {
      console.log('Sample appointment doctorId:', appointments[0].doctorId);
      console.log('Sample appointment date:', appointments[0].date);
    }
    console.log('===================================\n');
    
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('❌ DOCTOR APPOINTMENTS ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
