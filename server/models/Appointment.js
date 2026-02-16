const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['BOOKED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
    default: 'BOOKED'
  }
}, {
  timestamps: true
});

// Compound index to prevent double booking
appointmentSchema.index({ doctorId: 1, date: 1, time: 1 }, { unique: true });

// Index for patient queries
appointmentSchema.index({ patientId: 1, date: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);