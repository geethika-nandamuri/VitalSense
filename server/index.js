const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { checkEmbeddingsExist } = require('./config/pinecone');

dotenv.config();

// Validate critical environment variables for production
console.log('\n🔍 ENVIRONMENT VARIABLES CHECK:');
const requiredEnvVars = {
  'MONGODB_URI': process.env.MONGODB_URI,
  'JWT_SECRET': process.env.JWT_SECRET,
  'EMAIL_USER': process.env.EMAIL_USER,
  'EMAIL_PASS': process.env.EMAIL_PASS
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ MISSING ENVIRONMENT VARIABLES:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  
  if (process.env.NODE_ENV === 'production') {
    console.error('\n💥 CRITICAL: Missing environment variables in production. Exiting...\n');
    process.exit(1);
  } else {
    console.warn('\n⚠️  WARNING: Missing environment variables in development mode\n');
  }
} else {
  console.log('✅ All required environment variables are set');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER);
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/biomarkers', require('./routes/biomarkers'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/trends', require('./routes/trends'));
app.use('/api/summary', require('./routes/summary'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/reminders', require('./routes/reminders'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'VitalSense API is running' });
});

// Check Pinecone embeddings before starting server
async function startServer() {
  // Check if Pinecone is configured
  if (process.env.PINECONE_API_KEY) {
    console.log('Checking Pinecone for existing embeddings...');
    const embeddingsExist = await checkEmbeddingsExist();
    
    if (!embeddingsExist) {
      console.error('\n❌ No embeddings found in Pinecone.');
      console.error('   Run `seedEmbeddings.js` to generate and upsert embeddings into Pinecone before running the backend.');
      console.error('   Exiting...\n');
      process.exit(1);
    }
    
    console.log('✅ Embeddings found in Pinecone. Proceeding with server startup...\n');
  } else {
    console.log('⚠️  Pinecone API key not set. Skipping embeddings check.\n');
  }

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalsense');
    console.log('MongoDB connected');
    console.log("DB Name:", mongoose.connection.name);

    // Mark any already-past appointments as COMPLETED on startup
    try {
      const { markPastAppointmentsCompleted } = require('./scheduler/emailScheduler');
      await markPastAppointmentsCompleted();
    } catch (schedulerErr) {
      console.error('markPastAppointmentsCompleted error:', schedulerErr.message);
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
