require('dotenv').config();
const { checkEmbeddingsExist, getNamespacedIndex } = require('../config/pinecone');
const { retrieveBiomarkerInfo } = require('../services/ragService');

console.log('getNamespacedIndex exported:', typeof getNamespacedIndex);

checkEmbeddingsExist()
  .then(r => {
    console.log('checkEmbeddingsExist():', r);
    if (r) console.log('STATUS: Embeddings detected correctly — no fallback mode');
    else console.log('STATUS: Embeddings NOT detected');
    process.exit(0);
  })
  .catch(e => {
    console.error('ERROR:', e.message);
    process.exit(1);
  });
