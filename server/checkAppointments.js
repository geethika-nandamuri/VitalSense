// Script to check appointments in database
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Appointment = require('./models/Appointment');
const User = require('./models/User');

dotenv.config();

async function checkAppointments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalsense');
    console.log('Connected to MongoDB\n');
    
    // Get all users
    const users = await User.find({}).select('email name role _id doctorId patientId');
    
    console.log('=== USERS ===');
    users.forEach(user => {
      console.log(`${user.role}: ${user.email} (_id: ${user._id})`);
    });
    console.log('');
    
    // Get all appointments
    const appointments = await Appointment.find({})
      .populate('doctorId', 'name email _id')
      .populate('patientId', 'name email _id');
    
    console.log('=== APPOINTMENTS ===');
    console.log(`Total: ${appointments.length}\n`);
    
    if (appointments.length === 0) {
      console.log('No appointments found in database.');
    } else {
      appointments.forEach((apt, index) => {
        console.log(`Appointment ${index + 1}:`);
        console.log(`  _id: ${apt._id}`);
        console.log(`  doctorId: ${apt.doctorId?._id || apt.doctorId} (${apt.doctorId?.name || 'NOT POPULATED'})`);
        console.log(`  patientId: ${apt.patientId?._id || apt.patientId} (${apt.patientId?.name || 'NOT POPULATED'})`);
        console.log(`  date: ${apt.date}`);
        console.log(`  time: ${apt.time}`);
        console.log(`  status: ${apt.status}`);
        console.log('');
      });
      
      // Check for mismatches
      console.log('=== VERIFICATION ===');
      const doctors = users.filter(u => u.role === 'DOCTOR');
      doctors.forEach(doctor => {
        const doctorAppointments = appointments.filter(apt => 
          String(apt.doctorId?._id || apt.doctorId) === String(doctor._id)
        );
        console.log(`Doctor ${doctor.email} (_id: ${doctor._id}): ${doctorAppointments.length} appointments`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAppointments();
