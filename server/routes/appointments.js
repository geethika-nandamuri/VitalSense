const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

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

    // Check doctor's max patients per slot capacity (future active appointments only)
    const maxPerSlot = doctor.doctorProfile?.maxPatientsPerSlot;
    if (maxPerSlot && maxPerSlot > 0) {
      const now = new Date();
      const slotAppointments = await Appointment.find({
        doctorId,
        date: appointmentDate,
        time,
        status: { $in: ['BOOKED', 'CONFIRMED'] }
      });
      const activeCount = slotAppointments.filter(apt => {
        const [h, m] = (apt.time || '00:00').split(':').map(Number);
        const aptDateTime = new Date(apt.date);
        aptDateTime.setHours(h, m, 0, 0);
        return aptDateTime > now;
      }).length;
      if (activeCount >= maxPerSlot) {
        return res.status(409).json({ success: false, message: 'This time slot is fully booked' });
      }
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

    // Send booking confirmation email (non-blocking)
    try {
      console.log('📧 CONFIRMATION EMAIL ATTEMPT:');
      console.log('   Patient Email:', req.user.email);
      console.log('   Doctor Name:', doctor.name);
      console.log('   Environment Check:');
      console.log('     EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
      console.log('     EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
      
      if (!req.user.email) {
        console.log('📧 CONFIRMATION EMAIL: skipped — no email on patient account');
      } else if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('📧 CONFIRMATION EMAIL: skipped — email credentials not configured');
      } else {
        const emailSent = await sendEmail(
          req.user.email,
          'Appointment Confirmed - VitalSense',
          `Hello ${req.user.name},

Your appointment has been confirmed!

Details:
• Doctor: Dr. ${doctor.name}
• Date: ${appointmentDate.toDateString()}
• Time: ${time}

Thank you for choosing VitalSense.

Best regards,
VitalSense Team`
        );
        
        if (emailSent) {
          console.log('📧 CONFIRMATION EMAIL: sent successfully');
          appointment.confirmationEmailSent = true;
          await appointment.save();
        } else {
          console.error('📧 CONFIRMATION EMAIL: failed to send (check detailed logs above)');
          // Don't fail the appointment booking if email fails
        }
      }
    } catch (emailErr) {
      console.error('📧 CONFIRMATION EMAIL ERROR:');
      console.error('   Error Message:', emailErr.message);
      console.error('   Error Stack:', emailErr.stack);
      // Don't fail the appointment booking if email fails
    }

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
    
    // Get all appointments for this doctor on this date (future only, active only)
    const now = new Date();
    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: start, $lte: end },
      status: { $in: ['BOOKED', 'CONFIRMED'] },
      $or: [
        { date: { $gt: now } },
        { date: { $gte: start, $lte: end } }
      ]
    }).then(apts => apts.filter(apt => {
      const [h, m] = (apt.time || '00:00').split(':').map(Number);
      const aptDateTime = new Date(apt.date);
      aptDateTime.setHours(h, m, 0, 0);
      return aptDateTime > now;
    }));
    
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

// Cancel appointment (patient only)
router.patch('/:id/cancel', authenticate, requireRole('PATIENT'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    // Send cancellation email (non-blocking)
    try {
      console.log('📧 CANCELLATION EMAIL ATTEMPT:');
      console.log('   Patient Email:', req.user.email);
      
      if (!req.user.email) {
        console.log('📧 CANCELLATION EMAIL: skipped — no email on patient account');
      } else if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('📧 CANCELLATION EMAIL: skipped — email credentials not configured');
      } else {
        const emailSent = await sendEmail(
          req.user.email,
          'Appointment Cancelled - VitalSense',
          `Hello ${req.user.name},

Your appointment has been cancelled successfully.

Cancelled Appointment Details:
• Doctor: Dr. ${appointment.doctorId?.name}
• Date: ${new Date(appointment.date).toDateString()}
• Time: ${appointment.time}

If you need to reschedule, please book a new appointment through the VitalSense platform.

Best regards,
VitalSense Team`
        );
        
        if (emailSent) {
          console.log('📧 CANCELLATION EMAIL: sent successfully');
        } else {
          console.error('📧 CANCELLATION EMAIL: failed to send (check detailed logs above)');
        }
      }
    } catch (emailErr) {
      console.error('📧 CANCELLATION EMAIL ERROR:');
      console.error('   Error Message:', emailErr.message);
      console.error('   Error Stack:', emailErr.stack);
    }

    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;