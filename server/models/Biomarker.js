const mongoose = require('mongoose');

const biomarkerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    index: true
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  testName: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  referenceRange: {
    min: Number,
    max: Number,
    unit: String
  },
  status: {
    type: String,
    enum: ['normal', 'low', 'high', 'critical'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  normalizedValue: {
    type: Number,
    required: true
  },
  normalizedUnit: {
    type: String,
    default: 'SI'
  }
}, {
  timestamps: true
});

// Index for efficient time-series queries
biomarkerSchema.index({ userId: 1, testName: 1, date: 1 });

module.exports = mongoose.model('Biomarker', biomarkerSchema);
