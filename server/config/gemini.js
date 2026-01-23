const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getGeminiModel = (modelName = null) => {
  const model = modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return genAI.getGenerativeModel({ model });
};

const getGeminiVisionModel = (modelName = null) => {
  const model = modelName || process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return genAI.getGenerativeModel({ model });
};

module.exports = {
  getGeminiModel,
  getGeminiVisionModel
};