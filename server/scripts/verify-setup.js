/**
 * Quick setup verification script
 * Run: node scripts/verify-setup.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { getGeminiModel } = require('../config/gemini');

async function verifySetup() {
  console.log('🔍 Verifying VitalSense setup...\n');

  // Check environment variables
  console.log('1. Checking environment variables...');
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'GEMINI_API_KEY'
  ];

  const missing = [];
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
      console.log(`   ❌ ${varName} is missing`);
    } else {
      console.log(`   ✅ ${varName} is set`);
    }
  });

  if (missing.length > 0) {
    console.log(`\n⚠️  Missing required environment variables: ${missing.join(', ')}`);
    console.log('   Please check your server/.env file\n');
    return false;
  }

  // Check MongoDB connection
  console.log('\n2. Checking MongoDB connection...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('   ✅ MongoDB connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log(`   ❌ MongoDB connection failed: ${error.message}`);
    console.log('   Please ensure MongoDB is running and MONGODB_URI is correct\n');
    return false;
  }

  // Check Gemini API
  console.log('\n3. Checking Gemini API...');
  try {
    const model = getGeminiModel();
    const result = await model.generateContent('Say "OK" if you can read this.');
    const response = await result.response;
    const text = response.text();
    console.log('   ✅ Gemini API is working');
    console.log(`   Response: ${text.substring(0, 50)}...`);
  } catch (error) {
    console.log(`   ❌ Gemini API test failed: ${error.message}`);
    console.log('   Please check your GEMINI_API_KEY\n');
    return false;
  }

  // Check Pinecone (optional)
  console.log('\n4. Checking Pinecone (optional)...');
  if (process.env.PINECONE_API_KEY) {
    console.log('   ✅ Pinecone API key is set');
    console.log('   Note: Full Pinecone integration requires index setup');
  } else {
    console.log('   ⚠️  Pinecone API key not set (optional, using Gemini for RAG)');
  }

  console.log('\n✅ Setup verification complete!');
  console.log('   You can now start the server with: npm run dev\n');
  return true;
}

verifySetup()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Verification error:', error);
    process.exit(1);
  });
