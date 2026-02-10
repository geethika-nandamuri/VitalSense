const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalsense');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    console.log('Cleared existing hospitals and doctors');

    // Seed hospitals
    const hospitals = await Hospital.insertMany([
      {
        name: 'City General Hospital',
        city: 'New York',
        address: '123 Main St, New York, NY 10001',
        departments: ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine']
      },
      {
        name: 'Metro Health Center',
        city: 'Los Angeles',
        address: '456 Health Ave, Los Angeles, CA 90210',
        departments: ['Dermatology', 'Pediatrics', 'Internal Medicine', 'Psychiatry']
      },
      {
        name: 'Regional Medical Center',
        city: 'Chicago',
        address: '789 Medical Blvd, Chicago, IL 60601',
        departments: ['Emergency Medicine', 'Surgery', 'Radiology', 'Oncology']
      }
    ]);

    console.log('Seeded hospitals:', hospitals.length);

    // Seed doctors
    const doctors = await Doctor.insertMany([
      {
        name: 'Dr. Sarah Johnson',
        specialization: 'Cardiology',
        hospitalId: hospitals[0]._id,
        experienceYears: 12,
        fee: 200,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday'],
        availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
      },
      {
        name: 'Dr. Michael Chen',
        specialization: 'Neurology',
        hospitalId: hospitals[0]._id,
        experienceYears: 8,
        fee: 250,
        availableDays: ['Tuesday', 'Thursday', 'Friday', 'Saturday'],
        availableSlots: ['10:00', '11:00', '14:00', '15:00', '16:00']
      },
      {
        name: 'Dr. Emily Rodriguez',
        specialization: 'Dermatology',
        hospitalId: hospitals[1]._id,
        experienceYears: 6,
        fee: 150,
        availableDays: ['Monday', 'Wednesday', 'Thursday', 'Friday'],
        availableSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00']
      },
      {
        name: 'Dr. James Wilson',
        specialization: 'Pediatrics',
        hospitalId: hospitals[1]._id,
        experienceYears: 15,
        fee: 180,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableSlots: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
      },
      {
        name: 'Dr. Lisa Thompson',
        specialization: 'Internal Medicine',
        hospitalId: hospitals[1]._id,
        experienceYears: 10,
        fee: 175,
        availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00']
      },
      {
        name: 'Dr. Robert Davis',
        specialization: 'Emergency Medicine',
        hospitalId: hospitals[2]._id,
        experienceYears: 7,
        fee: 220,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        availableSlots: ['08:00', '12:00', '16:00', '20:00']
      },
      {
        name: 'Dr. Amanda Garcia',
        specialization: 'Surgery',
        hospitalId: hospitals[2]._id,
        experienceYears: 14,
        fee: 300,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        availableSlots: ['07:00', '08:00', '13:00', '14:00']
      },
      {
        name: 'Dr. Kevin Lee',
        specialization: 'Oncology',
        hospitalId: hospitals[2]._id,
        experienceYears: 11,
        fee: 280,
        availableDays: ['Tuesday', 'Thursday', 'Friday', 'Saturday'],
        availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
      }
    ]);

    console.log('Seeded doctors:', doctors.length);
    console.log('✅ Seed data inserted successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();