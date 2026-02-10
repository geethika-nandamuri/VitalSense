const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const {
  getHospitals,
  getDoctors,
  bookAppointment,
  getMyAppointments,
  cancelAppointment
} = require('../controllers/appointmentController');

const router = express.Router();

// Public routes
router.get('/hospitals', getHospitals);
router.get('/doctors', getDoctors);

// Protected routes (require auth or patient-id header)
router.post('/appointments', optionalAuth, bookAppointment);
router.get('/appointments/my', optionalAuth, getMyAppointments);
router.patch('/appointments/:id/cancel', optionalAuth, cancelAppointment);

module.exports = router;