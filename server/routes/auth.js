const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Patient Signup
router.post('/patient/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    
    const { email, password, name } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    let patientId = User.generatePatientId();
    
    // Ensure unique patientId
    while (await User.findOne({ patientId })) {
      patientId = User.generatePatientId();
    }
    
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: 'PATIENT',
      patientId
    });
    
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        patientId: user.patientId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Doctor Signup
router.post('/doctor/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    
    const { email, password, name } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    let doctorId = User.generateDoctorId();
    
    // Ensure unique doctorId
    while (await User.findOne({ doctorId })) {
      doctorId = User.generateDoctorId();
    }
    
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: 'DOCTOR',
      doctorId,
      doctorProfile: {
        profileCompleted: false
      }
    });
    
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        doctorId: user.doctorId,
        profileCompleted: false
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Patient Login
router.post('/patient/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    const user = await User.findOne({ email, role: 'PATIENT' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        patientId: user.patientId,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Doctor Login
router.post('/doctor/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    const user = await User.findOne({ email, role: 'DOCTOR' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        doctorId: user.doctorId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Legacy endpoints for backward compatibility
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    
    const { email, password, name } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    let patientId = User.generatePatientId();
    
    while (await User.findOne({ patientId })) {
      patientId = User.generatePatientId();
    }
    
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: 'PATIENT',
      patientId
    });
    
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        patientId: user.patientId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        patientId: user.patientId,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      patientId: req.user.patientId,
      doctorId: req.user.doctorId,
      profileCompleted: req.user.role === 'DOCTOR' ? (req.user.doctorProfile?.profileCompleted || false) : true,
      preferences: req.user.preferences
    }
  });
});

// Update preferences
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { diet, age, conditions, gender } = req.body;
    
    req.user.preferences = {
      diet: diet || req.user.preferences.diet,
      age: age || req.user.preferences.age,
      conditions: conditions || req.user.preferences.conditions,
      gender: gender || req.user.preferences.gender
    };
    
    await req.user.save();
    
    res.json({ preferences: req.user.preferences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
