// Debug script to check user roles
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalsense');
    console.log('Connected to MongoDB');
    
    const users = await User.find({}).select('email name role patientId doctorId');
    
    console.log('\n📊 USERS IN DATABASE:');
    console.log('='.repeat(80));
    
    users.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: "${user.role}" (type: ${typeof user.role})`);
      console.log(`PatientId: ${user.patientId || 'N/A'}`);
      console.log(`DoctorId: ${user.doctorId || 'N/A'}`);
      console.log('-'.repeat(80));
    });
    
    console.log(`\n✅ Total users: ${users.length}`);
    console.log(`👤 Patients: ${users.filter(u => u.role === 'PATIENT').length}`);
    console.log(`👨‍⚕️ Doctors: ${users.filter(u => u.role === 'DOCTOR').length}`);
    console.log(`❓ Other: ${users.filter(u => u.role !== 'PATIENT' && u.role !== 'DOCTOR').length}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
