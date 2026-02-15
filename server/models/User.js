const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['PATIENT', 'DOCTOR'],
    required: true,
    default: 'PATIENT'
  },
  patientId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  doctorId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  doctorProfile: {
    phone: String,
    city: String,
    hospitalName: String,
    specialization: String,
    hospital: String,
    experienceYears: Number,
    consultationFee: Number,
    maxPatientsPerSlot: Number,
    timeWindow: {
      start: String,
      end: String
    },
    profileCompleted: {
      type: Boolean,
      default: false
    }
  },
  preferences: {
    diet: {
      type: String,
      enum: ['vegetarian', 'non-vegetarian', 'vegan', 'none'],
      default: 'none'
    },
    age: {
      type: Number,
      min: 0
    },
    conditions: [{
      type: String
    }],
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    }
  }
}, {
  timestamps: true
});

// Generate unique patient ID
userSchema.statics.generatePatientId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'VS-PAT-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

// Generate unique doctor ID
userSchema.statics.generateDoctorId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'VS-DOC-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

module.exports = mongoose.model('User', userSchema);
