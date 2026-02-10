const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// Get hospitals with optional city filter
const getHospitals = async (req, res) => {
  try {
    const { city } = req.query;
    const filter = city ? { city: new RegExp(city, 'i') } : {};
    
    const hospitals = await Hospital.find(filter).sort({ name: 1 });
    
    res.json({
      success: true,
      data: hospitals,
      message: 'Hospitals retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving hospitals',
      error: error.message
    });
  }
};

// Get doctors with filters
const getDoctors = async (req, res) => {
  try {
    const { hospitalId, specialization, city } = req.query;
    let filter = {};
    
    if (hospitalId) filter.hospitalId = hospitalId;
    if (specialization) filter.specialization = new RegExp(specialization, 'i');
    
    let doctors = await Doctor.find(filter)
      .populate('hospitalId', 'name city address')
      .sort({ name: 1 });
    
    // Filter by city if provided (through hospital)
    if (city && !hospitalId) {
      doctors = doctors.filter(doctor => 
        doctor.hospitalId.city.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    res.json({
      success: true,
      data: doctors,
      message: 'Doctors retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving doctors',
      error: error.message
    });
  }
};

// Book appointment
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, hospitalId, date, timeSlot, reason } = req.body;
    const patientId = req.userId || req.headers['x-patient-id'];
    
    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: 'Patient authentication required'
      });
    }
    
    // Validate required fields
    if (!doctorId || !hospitalId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctorId, hospitalId, date, timeSlot'
      });
    }
    
    // Validate date is in future
    const appointmentDate = new Date(date);
    if (appointmentDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }
    
    // Check if doctor exists and validate time slot
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    if (!doctor.availableSlots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is not available for this doctor'
      });
    }
    
    // Check for existing appointment (prevent double booking)
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: appointmentDate,
      timeSlot,
      status: { $in: ['Pending', 'Confirmed'] }
    });
    
    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
    
    // Create appointment
    const appointment = new Appointment({
      patientId,
      doctorId,
      hospitalId,
      date: appointmentDate,
      timeSlot,
      reason: reason || ''
    });
    
    await appointment.save();
    
    // Populate appointment details for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctorId', 'name specialization fee')
      .populate('hospitalId', 'name city address');
    
    res.status(201).json({
      success: true,
      data: populatedAppointment,
      message: 'Appointment booked successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
};

// Get patient's appointments
const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.userId || req.headers['x-patient-id'];
    
    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: 'Patient authentication required'
      });
    }
    
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name specialization fee')
      .populate('hospitalId', 'name city address')
      .sort({ date: -1 });
    
    // Separate upcoming and past appointments
    const now = new Date();
    const upcoming = appointments.filter(apt => new Date(apt.date) >= now);
    const past = appointments.filter(apt => new Date(apt.date) < now);
    
    res.json({
      success: true,
      data: {
        upcoming,
        past,
        total: appointments.length
      },
      message: 'Appointments retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving appointments',
      error: error.message
    });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.userId || req.headers['x-patient-id'];
    
    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: 'Patient authentication required'
      });
    }
    
    const appointment = await Appointment.findOne({
      _id: id,
      patientId,
      status: { $in: ['Pending', 'Confirmed'] }
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or cannot be cancelled'
      });
    }
    
    // Check if appointment is in the future
    if (new Date(appointment.date) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel past appointments'
      });
    }
    
    appointment.status = 'Cancelled';
    await appointment.save();
    
    res.json({
      success: true,
      data: appointment,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
};

module.exports = {
  getHospitals,
  getDoctors,
  bookAppointment,
  getMyAppointments,
  cancelAppointment
};