/**
 * Basic seed script that creates simple embeddings without API calls
 * Run: node scripts/seedBasicEmbeddings.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getPineconeIndex } = require('../config/pinecone');

// Generate a simple 768-dimensional vector (required by Pinecone)
function generateBasicEmbedding(text) {
  const vector = new Array(768).fill(0);
  // Simple hash-based approach for consistent vectors
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) & 0xffffffff;
  }
  
  // Fill vector with normalized values based on hash
  for (let i = 0; i < 768; i++) {
    vector[i] = Math.sin(hash + i) * 0.1;
  }
  return vector;
}

const BASIC_BIOMARKERS = [
  'glucose', 'hba1c', 'tsh', 'ldl', 'hdl', 'triglycerides', 'total cholesterol',
  'vitamin d', 'creatinine', 'hemoglobin', 'wbc', 'rbc', 'platelets'
];

async function seedBasicEmbeddings() {
  console.log('🌱 Starting basic embeddings seed (no API calls)...\n');

  try {
    const index = getPineconeIndex();
    const namespace = 'biomarker-definitions';
    const nsIndex = index.namespace(namespace);
    
    const vectors = [];
    
    for (const biomarker of BASIC_BIOMARKERS) {
      const content = `Biomarker: ${biomarker}. This is a laboratory test that measures ${biomarker} levels in blood or other body fluids.`;
      const embedding = generateBasicEmbedding(content);
      
      vectors.push({
        id: biomarker.toLowerCase().replace(/\s+/g, '-'),
        values: embedding,
        metadata: {
          biomarker: biomarker,
          content: content,
          type: 'biomarker-definition'
        }
      });
    }

    console.log(`📤 Upserting ${vectors.length} basic vectors to Pinecone...`);
    await nsIndex.upsert(vectors);
    
    console.log(`✅ Successfully seeded ${vectors.length} basic embeddings!`);
    console.log(`   Namespace: biomarker-definitions`);
    console.log(`   Index: ${process.env.PINECONE_INDEX_NAME || 'vitalsense'}\n`);

  } catch (error) {
    console.error('\n❌ Error seeding basic embeddings:', error.message);
    process.exit(1);
  }
}

seedBasicEmbeddings()
  .then(() => {
    console.log('🎉 Basic seed completed!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Basic seed failed:', error);
    process.exit(1);
  });