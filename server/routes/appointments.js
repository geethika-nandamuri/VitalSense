const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

const router = express.Router();

// Book appointment (patient only)
router.post('/book', authenticate, requireRole('PATIENT'), async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    
    console.log('\n=== BOOKING REQUEST ===');
    console.log('User ID:', req.user._id);
    console.log('User Email:', req.user.email);
    console.log('User Role:', req.user.role);
    console.log('Request Body:', { doctorId, date, time, reason });
    console.log('======================\n');
    
    if (!doctorId || !date || !time) {
      return res.status(400).json({ success: false, message: 'Doctor, date, and time are required' });
    }
    
    // Verify doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'DOCTOR' });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    
    // Normalize date to start of day
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    
    // Check for double booking
    const existing = await Appointment.findOne({
      doctorId,
      date: appointmentDate,
      time,
      status: { $in: ['BOOKED', 'CONFIRMED'] }
    });
    
    if (existing) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }
    
    const appointment = new Appointment({
      patientId: req.user._id,
      doctorId,
      date: appointmentDate,
      time,
      reason: reason || '',
      status: 'BOOKED'
    });
    
    await appointment.save();
    
    const populated = await Appointment.findById(appointment._id)
      .populate('doctorId', 'name email doctorId doctorProfile')
      .populate('patientId', 'name email patientId phoneNumber');
    
    console.log('✅ APPOINTMENT SAVED:');
    console.log('  Appointment ID:', populated._id);
    console.log('  Doctor ID:', populated.doctorId._id);
    console.log('  Doctor Name:', populated.doctorId.name);
    console.log('  Patient ID:', populated.patientId._id);
    console.log('  Patient Name:', populated.patientId.name);
    console.log('  Date:', populated.date);
    console.log('  Time:', populated.time);
    console.log('======================\n');
    
    res.status(201).json({ success: true, message: 'Booked', appointment: populated });
  } catch (error) {
    console.error('❌ BOOKING ERROR:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get availability for a doctor on a specific date
router.get('/availability', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'Doctor ID and date are required' });
    }
    
    // Normalize date to start/end of day
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    // Get all appointments for this doctor on this date
    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: start, $lte: end },
      status: { $in: ['BOOKED', 'CONFIRMED'] }
    });
    
    // Count appointments per time slot
    const slotCounts = {};
    appointments.forEach(apt => {
      slotCounts[apt.time] = (slotCounts[apt.time] || 0) + 1;
    });
    
    res.json({ success: true, data: slotCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;