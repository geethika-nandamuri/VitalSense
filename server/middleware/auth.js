const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔑 AUTH: Token present:', !!token);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔑 AUTH: Decoded userId:', decoded.userId);
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ AUTH: User not found for userId:', decoded.userId);
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('✅ AUTH: User found:', user.email, 'Role:', user.role);
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.log('❌ AUTH ERROR:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based authorization middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('❌ ROLE CHECK: No user in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get role from Mongoose document (handle both .role and .get('role'))
    const rawRole = req.user.role || req.user.get('role');
    
    console.log('🔍 ROLE CHECK: User:', req.user.email, 'Raw Role:', rawRole, 'Type:', typeof rawRole, 'Required:', roles);
    
    // Normalize roles to uppercase for comparison
    const userRole = String(rawRole || '').toUpperCase();
    const allowedRoles = roles.map(role => String(role).toUpperCase());
    
    console.log('🔍 NORMALIZED: User role:', userRole, 'Allowed:', allowedRoles);
    
    if (!allowedRoles.includes(userRole)) {
      console.log('❌ ROLE CHECK FAILED: User role', userRole, 'not in', allowedRoles);
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        userRole: userRole,
        requiredRoles: allowedRoles
      });
    }
    
    console.log('✅ ROLE CHECK PASSED');
    next();
  };
};

module.exports = { authenticate, optionalAuth, requireRole };
