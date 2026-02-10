const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  departments: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient city-based queries
hospitalSchema.index({ city: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);