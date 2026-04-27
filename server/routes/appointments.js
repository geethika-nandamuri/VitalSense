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
    
    // Combine date + time into a single precise DateTime for storage and comparison
    // e.g. date="2025-07-10", time="14:30" → 2025-07-10T14:30:00 local → stored as UTC
    const appointmentDateTime = new Date(`${date}T${time}:00`);
    if (isNaN(appointmentDateTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date or time format' });
    }
    console.log('Saved Date:', appointmentDateTime, '| Now:', new Date());

    // Derive midnight-normalised date for the unique index (doctorId + date + time)
    const appointmentDate = new Date(appointmentDateTime);
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

    // Check doctor's max patients per slot — count active bookings directly in DB
    const maxPerSlot = doctor.doctorProfile?.maxPatientsPerSlot;
    if (maxPerSlot && maxPerSlot > 0) {
      const activeCount = await Appointment.countDocuments({
        doctorId,
        date: appointmentDate,
        time,
        status: { $in: ['BOOKED', 'CONFIRMED'] }
      });
      if (activeCount >= maxPerSlot) {
        return res.status(409).json({ success: false, message: 'This time slot is fully booked' });
      }
    }
    
    const appointment = new Appointment({
      patientId: req.user._id,
      doctorId,
      date: appointmentDateTime,
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
// Returns { "09:00": 2, "10:30": 1, ... } — count of active bookings per slot
router.get('/availability', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'Doctor ID and date are required' });
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Count only active (non-cancelled) bookings per slot — all filtering in DB
    const counts = await Appointment.aggregate([
      {
        $match: {
          doctorId: new (require('mongoose').Types.ObjectId)(doctorId),
          date: { $gte: start, $lte: end },
          status: { $in: ['BOOKED', 'CONFIRMED'] }
        }
      },
      { $group: { _id: '$time', count: { $sum: 1 } } }
    ]);

    const slotCounts = {};
    counts.forEach(({ _id, count }) => { slotCounts[_id] = count; });

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