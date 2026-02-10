const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  experienceYears: {
    type: Number,
    required: true,
    min: 0
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  availableDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  availableSlots: [{
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  }]
}, {
  timestamps: true
});

// Index for efficient queries
doctorSchema.index({ hospitalId: 1, specialization: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);