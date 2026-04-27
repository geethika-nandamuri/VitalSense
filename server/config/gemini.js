const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getGeminiModel = (modelName = 'gemini-2.5-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

const getGeminiVisionModel = (modelName = 'gemini-2.5-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

const FALLBACK_MODEL = 'gemini-1.5-flash';
const MAX_RETRIES = 2;

const isRetryableError = (error) => {
  const msg = error?.message || '';
  return msg.includes('503') || msg.includes('Service Unavailable') ||
    msg.includes('overloaded') || msg.includes('high demand') ||
    msg.includes('429') || msg.includes('quota');
};

/**
 * Calls generateContent with retry + fallback to gemini-1.5-flash on 503/overload.
 * @param {Array} contentParts - parts array passed to generateContent
 * @param {string} primaryModel - model name to try first
 * @returns {Promise<string>} - response text
 */
const callWithRetryAndFallback = async (contentParts, primaryModel = 'gemini-2.5-flash') => {
  const tryModel = async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(contentParts);
        return result.response.text();
      } catch (err) {
        const isLast = attempt === MAX_RETRIES;
        if (!isRetryableError(err) || isLast) throw err;
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
        console.warn(`[Gemini] ${modelName} attempt ${attempt + 1} failed (${err.message}). Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  };

  try {
    return await tryModel(primaryModel);
  } catch (primaryErr) {
    if (!isRetryableError(primaryErr)) throw primaryErr;
    console.warn(`[Gemini] Primary model (${primaryModel}) exhausted retries. Switching to fallback: ${FALLBACK_MODEL}`);
    try {
      return await tryModel(FALLBACK_MODEL);
    } catch (fallbackErr) {
      console.error(`[Gemini] Fallback model (${FALLBACK_MODEL}) also failed:`, fallbackErr.message);
      const serviceError = new Error('AI service is currently unavailable. Please try again later.');
      serviceError.isServiceUnavailable = true;
      throw serviceError;
    }
  }
};

module.exports = {
  getGeminiModel,
  getGeminiVisionModel,
  callWithRetryAndFallback
};
