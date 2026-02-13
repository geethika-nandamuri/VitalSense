const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all users without a role
    const usersWithoutRole = await User.find({ role: { $exists: false } });
    console.log(`\n📊 Found ${usersWithoutRole.length} users without role`);

    // Find all users without patientId
    const usersWithoutPatientId = await User.find({ 
      role: 'PATIENT',
      patientId: { $exists: false } 
    });
    console.log(`📊 Found ${usersWithoutPatientId.length} PATIENT users without patientId`);

    let updatedCount = 0;
    let patientIdCount = 0;

    // Update users without role to PATIENT
    for (const user of usersWithoutRole) {
      user.role = 'PATIENT';
      
      // Generate unique patientId
      let patientId = User.generatePatientId();
      while (await User.findOne({ patientId })) {
        patientId = User.generatePatientId();
      }
      user.patientId = patientId;
      
      await user.save();
      updatedCount++;
      console.log(`✅ Updated user ${user.email} - Role: PATIENT, Patient ID: ${patientId}`);
    }

    // Update PATIENT users without patientId
    for (const user of usersWithoutPatientId) {
      // Generate unique patientId
      let patientId = User.generatePatientId();
      while (await User.findOne({ patientId })) {
        patientId = User.generatePatientId();
      }
      user.patientId = patientId;
      
      await user.save();
      patientIdCount++;
      console.log(`✅ Added Patient ID to ${user.email}: ${patientId}`);
    }

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   - ${updatedCount} users updated with PATIENT role and Patient ID`);
    console.log(`   - ${patientIdCount} users updated with Patient ID`);
    console.log(`   - Total users processed: ${updatedCount + patientIdCount}`);

    // Display summary
    const totalPatients = await User.countDocuments({ role: 'PATIENT' });
    const totalDoctors = await User.countDocuments({ role: 'DOCTOR' });
    const patientsWithId = await User.countDocuments({ 
      role: 'PATIENT', 
      patientId: { $exists: true } 
    });

    console.log(`\n📊 Current Database Status:`);
    console.log(`   - Total Patients: ${totalPatients}`);
    console.log(`   - Patients with ID: ${patientsWithId}`);
    console.log(`   - Total Doctors: ${totalDoctors}`);

    if (patientsWithId < totalPatients) {
      console.log(`\n⚠️  Warning: ${totalPatients - patientsWithId} patients still without Patient ID`);
    } else {
      console.log(`\n✅ All patients have Patient IDs!`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

// Run migration
console.log('🚀 Starting user migration...\n');
migrateUsers();
