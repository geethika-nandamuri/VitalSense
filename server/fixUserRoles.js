// Script to fix user roles (ensure uppercase PATIENT/DOCTOR)
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function fixUserRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalsense');
    console.log('Connected to MongoDB\n');
    
    // Find all users with lowercase roles
    const usersToFix = await User.find({
      $or: [
        { role: 'patient' },
        { role: 'doctor' },
        { role: { $exists: false } }
      ]
    });
    
    if (usersToFix.length === 0) {
      console.log('✅ All user roles are correct!');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`Found ${usersToFix.length} users with incorrect roles:\n`);
    
    for (const user of usersToFix) {
      const oldRole = user.role || 'undefined';
      
      // Fix role based on existing data
      if (user.patientId) {
        user.role = 'PATIENT';
      } else if (user.doctorId) {
        user.role = 'DOCTOR';
      } else if (oldRole.toLowerCase() === 'patient') {
        user.role = 'PATIENT';
      } else if (oldRole.toLowerCase() === 'doctor') {
        user.role = 'DOCTOR';
      } else {
        // Default to PATIENT if unclear
        user.role = 'PATIENT';
      }
      
      await user.save();
      console.log(`✅ Fixed: ${user.email}`);
      console.log(`   Old role: "${oldRole}" → New role: "${user.role}"\n`);
    }
    
    console.log(`\n✅ Fixed ${usersToFix.length} user roles!`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUserRoles();
