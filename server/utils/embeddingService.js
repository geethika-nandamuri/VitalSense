/**
 * Shared embedding service using Google's text-embedding-004 model
 * Provides a consistent interface for generating embeddings across the application
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

/**
 * Initialize the Google Generative AI client
 */
function initGenAI() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Generate embedding for text using Google's text-embedding-004 model
 * 
 * @param {string} text - The text to generate an embedding for
 * @returns {Promise<number[]>} - A 768-dimensional embedding vector
 * 
 * @example
 * const embedding = await generateEmbedding("Your text here");
 * // Returns: [0.123, -0.456, ...] (768 dimensions)
 */
async function generateEmbedding(text) {
  try {
    // Use Google's text-embedding-004 model (latest embedding model)
    const ai = initGenAI();
    const model = ai.getGenerativeModel({ 
      model: 'text-embedding-004' 
    });
    
    // Generate embedding using embedContent method
    const result = await model.embedContent(text);
    
    // Extract embedding values from supported response shapes:
    // - result.embedding.values
    // - result.data[0].embedding.values
    // (Some SDK versions use different wrappers.)
    const values =
      result?.embedding?.values ??
      result?.data?.[0]?.embedding?.values ??
      null;

    // Only fallback if API returns null/empty embedding
    if (values == null) {
      throw new Error('Embedding was null/undefined from Google API');
    }
    if (!Array.isArray(values)) {
      throw new Error('Embedding values was not an array');
    }
    if (values.length === 0) {
      throw new Error('Embedding values was empty');
    }
    if (!values.every((v) => typeof v === 'number' && Number.isFinite(v))) {
      throw new Error('Embedding values contained non-numeric entries');
    }

    console.log(`Embedding length: ${values.length}`);
    return values;
  } catch (error) {
    // If text-embedding-004 fails, provide helpful error message
    if (error.message.includes('model') || error.message.includes('not found')) {
      console.error(`\n❌ Error: text-embedding-004 model not available.`);
      console.error(`   This might be due to:`);
      console.error(`   1. API key doesn't have access to embedding models`);
      console.error(`   2. Model name has changed`);
      console.error(`   3. Region/API endpoint restrictions\n`);
      throw error;
    }
    
    // Only fallback if the API returned a null/empty embedding. Otherwise, surface the error.
    const msg = String(error?.message || '');
    const shouldFallback =
      msg.includes('Embedding was null/undefined') ||
      msg.includes('Embedding values was empty');

    if (!shouldFallback) {
      throw error;
    }

    console.warn(`⚠️  Warning: Google embedding returned null/empty. Using fallback method (not recommended for production)...`);
    
    // Simple hash-based embedding as last resort
    // This creates a 768-dimensional vector (matching text-embedding-004 dimension)
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(768).fill(0);
    
    words.forEach((word, i) => {
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(j);
        hash = hash & hash;
      }
      const index = Math.abs(hash) % 768;
      embedding[index] += 1 / (i + 1);
    });
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }
}

/**
 * Get the embedding dimension for text-embedding-004
 * @returns {number} - The dimension (768)
 */
function getEmbeddingDimension() {
  return 768;
}

module.exports = {
  generateEmbedding,
  getEmbeddingDimension
};
