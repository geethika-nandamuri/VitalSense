const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { checkEmbeddingsExist } = require('./config/pinecone');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/biomarkers', require('./routes/biomarkers'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/trends', require('./routes/trends'));
app.use('/api/summary', require('./routes/summary'));

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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalsense', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
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
