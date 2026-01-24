const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Report = require('../models/Report');
const Biomarker = require('../models/Biomarker');

dotenv.config();

async function migrateUserData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if there are any reports/biomarkers with userId: null
    const nullUserReports = await Report.countDocuments({ userId: null });
    const nullUserBiomarkers = await Biomarker.countDocuments({ userId: null });

    console.log(`Found ${nullUserReports} reports with userId: null`);
    console.log(`Found ${nullUserBiomarkers} biomarkers with userId: null`);

    if (nullUserReports === 0 && nullUserBiomarkers === 0) {
      console.log('No data migration needed.');
      return;
    }

    console.log('\nNote: These records were created without user authentication.');
    console.log('They will remain accessible to non-authenticated users.');
    console.log('When users log in, they will only see their own data.');
    console.log('This is the expected behavior for the current system design.');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migrateUserData();