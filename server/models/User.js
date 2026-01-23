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

module.exports = mongoose.model('User', userSchema);
