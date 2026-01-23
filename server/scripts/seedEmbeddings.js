/**
 * Seed Pinecone with biomarker definition embeddings
 * Run: node scripts/seedEmbeddings.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getPineconeIndex } = require('../config/pinecone');
const { REFERENCE_RANGES } = require('../utils/referenceRanges');
const { generateEmbedding } = require('../utils/embeddingService');

// Common biomarkers to seed
const BIOMARKERS = [
  'glucose',
  'hba1c',
  'tsh',
  'ldl',
  'hdl',
  'triglycerides',
  'total cholesterol',
  'vitamin d',
  'uric acid',
  'creatinine',
  'hemoglobin',
  'mchc',
  'wbc',
  'rbc',
  'platelets',
  'alt',
  'ast',
  'alkaline phosphatase',
  'bilirubin',
  'bun',
  'sodium',
  'potassium',
  'calcium',
  'magnesium',
  'iron',
  'ferritin',
  'vitamin b12',
  'folate',
  'cortisol',
  'testosterone',
  'estradiol',
  'progesterone',
  'psa',
  'crp',
  'esr',
  'homocysteine',
  'apolipoprotein a',
  'apolipoprotein b',
  'lipoprotein a',
  'insulin',
  'c-peptide',
  't3',
  't4',
  'free t3',
  'free t4',
  'reverse t3',
  'vitamin a',
  'vitamin e',
  'zinc',
  'selenium',
  'copper',
  'manganese',
  'chromium',
  'iodine',
  'biotin',
  'vitamin k',
  'omega-3',
  'omega-6',
  'dhea',
  'igf-1',
  'shbg',
  'prolactin',
  'lh',
  'fsh',
  'aldosterone',
  'renin',
  'nt-probnp',
  'troponin',
  'ck-mb',
  'ldh',
  'ggt',
  'albumin',
  'globulin',
  'total protein',
  'microalbumin',
  'urine protein',
  'urine creatinine',
  'egfr',
  'bun/creatinine ratio',
  'anion gap',
  'osmolality',
  'ph',
  'pco2',
  'po2',
  'hco3',
  'base excess',
  'lactate',
  'ammonia',
  'ca 19-9',
  'ca 125',
  'ca 15-3',
  'cea',
  'afp',
  'beta-hcg',
  'pth',
  'calcitonin',
  'gh',
  'acth',
];


/**
 * Create comprehensive text content for a biomarker
 */
function createBiomarkerContent(biomarkerName) {
  const range = REFERENCE_RANGES[biomarkerName.toLowerCase()];
  const rangeText = range 
    ? `Normal Range: ${range.min}-${range.max} ${range.unit}`
    : 'Normal Range: Varies by age, gender, and lab';
  
  return `Biomarker: ${biomarkerName}

${rangeText}

Definition: ${biomarkerName} is a laboratory test that measures specific substances or markers in the blood, urine, or other body fluids. This test provides valuable information about various aspects of health, including organ function, metabolic status, nutritional status, and disease risk factors.

Wellness Relevance: ${biomarkerName} levels can be influenced by diet, lifestyle factors, exercise, sleep, stress, and environmental exposures. Understanding your ${biomarkerName} levels can help guide personalized wellness strategies.

Causes of Abnormal Levels: Abnormal ${biomarkerName} levels can be influenced by various factors including dietary choices, physical activity levels, sleep patterns, stress management, hydration status, medication use, and underlying health conditions.

Wellness Recommendations: Maintaining optimal ${biomarkerName} levels through a balanced diet, regular exercise, adequate sleep, stress management, and other lifestyle modifications can support overall health and wellness.

Note: This information is for wellness and educational purposes only and does not constitute medical advice. Always consult with healthcare professionals for medical decisions and interpretation of lab results.`;
}

/**
 * Seed embeddings into Pinecone
 */
async function seedEmbeddings() {
  console.log('🌱 Starting Pinecone embedding seed process...\n');
  console.log('📝 Note: Ensure your Pinecone index is created with dimension 768 (text-embedding-004 output dimension)\n');

  // Check environment variables
  if (!process.env.PINECONE_API_KEY) {
    console.error('❌ PINECONE_API_KEY is not set in environment variables.');
    console.error('   Please set PINECONE_API_KEY in your server/.env file.\n');
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables.');
    console.error('   Please set GEMINI_API_KEY in your server/.env file.\n');
    process.exit(1);
  }

  try {
    const index = getPineconeIndex();
    const namespace = 'biomarker-definitions';
    const nsIndex = index.namespace(namespace);
    
    console.log(`📊 Processing ${BIOMARKERS.length} biomarkers...\n`);

    // Pinecone upsert records: [{ id, values, metadata }]
    const vectors = [];
    let processed = 0;

    for (const biomarker of BIOMARKERS) {
      try {
        const content = createBiomarkerContent(biomarker);
        const embedding = await generateEmbedding(content);
        
        vectors.push({
          id: biomarker.toLowerCase().replace(/\s+/g, '-'),
          values: embedding,
          metadata: {
            biomarker: biomarker,
            content: content.substring(0, 500), // Store first 500 chars as metadata
            type: 'biomarker-definition'
          }
        });

        processed++;
        if (processed % 10 === 0) {
          console.log(`   Processed ${processed}/${BIOMARKERS.length} biomarkers...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Error processing ${biomarker}:`, error.message);
      }
    }

    console.log(`\n📤 Upserting ${vectors.length} vectors to Pinecone...`);

    // Upsert in batches (Pinecone recommends batching; 500 is typically safe)
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      // New-style upsert: pass the array of records directly
      await nsIndex.upsert(batch);
      console.log(`   ✅ Inserted ${batch.length} vectors`);
      console.log(`   ✅ Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
    }

    console.log(`\n✅ Successfully seeded ${vectors.length} embeddings into Pinecone!`);
    console.log(`   Namespace: biomarker-definitions`);
    console.log(`   Index: ${process.env.PINECONE_INDEX_NAME || 'vitalsense'}\n`);

  } catch (error) {
    console.error('\n❌ Error seeding embeddings:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seed function
seedEmbeddings()
  .then(() => {
    console.log('🎉 Seed process completed successfully!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Seed process failed:', error);
    process.exit(1);
  });
