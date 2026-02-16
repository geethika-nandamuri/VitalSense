const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

const router = express.Router();

// Book appointment (patient only)
router.post('/book', authenticate, requireRole('PATIENT'), async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    
    if (!doctorId || !date || !time) {
      return res.status(400).json({ success: false, message: 'Doctor, date, and time are required' });
    }
    
    // Verify doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'DOCTOR' });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    // Check for double booking
    const existing = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $in: ['BOOKED', 'CONFIRMED'] }
    });
    
    if (existing) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }
    
    const appointment = new Appointment({
      patientId: req.user._id,
      doctorId,
      date: new Date(date),
      time,
      reason: reason || '',
      status: 'BOOKED'
    });
    
    await appointment.save();
    
    const populated = await Appointment.findById(appointment._id)
      .populate('doctorId', 'name email doctorId doctorProfile')
      .populate('patientId', 'name email patientId');
    
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;