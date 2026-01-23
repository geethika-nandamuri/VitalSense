const { getPineconeIndex } = require('../config/pinecone');
const { getGeminiModel } = require('../config/gemini');

// For now, we'll use Gemini for text generation
// In production, you'd use text-embedding-004 via embeddingService.js to query Pinecone with embeddings

const retrieveBiomarkerInfo = async (testName, query = null) => {
  try {
    const index = getPineconeIndex();
    const namespace = 'biomarker-definitions';
    
    // Create a query embedding (simplified - in production use proper embeddings)
    const searchQuery = query || `What does ${testName} mean? What are its causes and implications?`;
    
    // For now, return a structured response using Gemini
    // In production, you'd query Pinecone with embeddings
    const model = getGeminiModel();
    
    const prompt = `You are a medical information assistant. Provide a clear, non-diagnostic explanation about the biomarker: ${testName}

Provide information in this structure:
1. Definition: What is ${testName}?
2. Normal Range: What are typical reference values?
3. Causes (if abnormal): What lifestyle or health factors might affect it?
4. Wellness Relevance: How can diet and lifestyle impact this biomarker?
5. Non-Diagnostic Note: Remind that this is for wellness purposes only.

Keep the response concise, science-backed, and wellness-focused (not diagnostic).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      testName,
      explanation: text,
      source: 'AI-generated wellness information'
    };
  } catch (error) {
    console.error('RAG retrieval error:', error);
    throw error;
  }
};

const retrieveNutritionGuidelines = async (testName, status, userPreferences = {}) => {
  try {
    const model = getGeminiModel();
    
    const dietPreference = userPreferences.diet || 'none';
    const conditions = userPreferences.conditions || [];
    
    const prompt = `You are a nutrition and lifestyle coach. Provide personalized, science-backed recommendations for managing ${testName} which is currently ${status}.

User preferences:
- Diet: ${dietPreference}
- Conditions: ${conditions.join(', ') || 'None specified'}

Provide actionable recommendations in this structure:
1. Dietary Changes: Specific foods to increase/decrease (considering ${dietPreference} diet)
2. Lifestyle Modifications: Exercise, sleep, stress management
3. Foods to Include: Specific examples with portions
4. Foods to Avoid: Specific examples
5. Timeline: Expected timeframe for seeing improvements (general wellness, not medical)

Keep recommendations practical, specific, and science-backed. Focus on wellness, not diagnosis.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      testName,
      status,
      recommendations: text,
      personalized: true
    };
  } catch (error) {
    console.error('Nutrition guidelines retrieval error:', error);
    throw error;
  }
};

module.exports = {
  retrieveBiomarkerInfo,
  retrieveNutritionGuidelines
};
