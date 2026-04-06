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
  },
  confirmationEmailSent: { type: Boolean, default: false },
  sameDayReminderSent: { type: Boolean, default: false },
  oneHourReminderSent: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Partial unique index — only enforce uniqueness for active (non-cancelled) appointments
// This allows a slot to be re-booked after cancellation
appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['BOOKED', 'CONFIRMED'] } } }
);

// Index for patient queries
appointmentSchema.index({ patientId: 1, date: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);