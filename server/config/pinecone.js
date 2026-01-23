const { Pinecone } = require('@pinecone-database/pinecone');

let pc = null;

/**
 * Initialize Pinecone client (serverless-ready).
 *
 * Pinecone serverless no longer uses "environment". The latest Node SDK only requires an apiKey
 * to connect to an existing index. We keep PINECONE_REGION in .env for clarity, but we do NOT
 * pass "environment" anywhere (to avoid: "The client configuration must have required property: environment.").
 */
function getPineconeClient() {
  if (!pc) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }
    pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return pc;
}

function getPineconeIndex(indexName = null) {
  const client = getPineconeClient();
  const index = indexName || process.env.PINECONE_INDEX_NAME || 'vitalsense';
  return client.index(index);
}

/**
 * Check if embeddings exist in Pinecone
 * @param {string} namespace - Namespace to check (default: 'biomarker-definitions')
 * @returns {Promise<boolean>} - True if embeddings exist, false otherwise
 */
const checkEmbeddingsExist = async (namespace = 'biomarker-definitions') => {
  try {
    // Skip check if Pinecone API key is not set
    if (!process.env.PINECONE_API_KEY) {
      return false;
    }

    const index = getPineconeIndex();
    
    // Get index statistics
    const indexStats = await index.describeIndexStats();

    // Log stats for debugging startup gating (counts only)
    try {
      console.log('Pinecone describeIndexStats():', JSON.stringify(indexStats, null, 2));
    } catch (_) {
      // ignore stringify failures
    }

    // Different SDK/API versions may return different field names:
    // - total_vector_count / vector_count (older)
    // - totalVectorCount / vectorCount (camelCase)
    // - totalRecordCount / recordCount (newer serverless)
    const totalVectorCount =
      indexStats.total_vector_count ??
      indexStats.totalVectorCount ??
      indexStats.totalRecordCount ??
      indexStats.total_record_count ??
      0;

    // If *any* vectors exist anywhere in the index, allow startup.
    // (Embeddings may be stored in a different namespace.)
    if (totalVectorCount > 0) {
      // If the specific namespace is present, log its count too (optional).
      const nsCount =
        indexStats?.namespaces?.[namespace]?.vector_count ??
        indexStats?.namespaces?.[namespace]?.vectorCount ??
        indexStats?.namespaces?.[namespace]?.recordCount ??
        indexStats?.namespaces?.[namespace]?.record_count ??
        null;

      if (nsCount === 0) {
        console.warn(
          `Pinecone has vectors (total=${totalVectorCount}) but namespace "${namespace}" appears empty.`
        );
      }
      return true;
    }
    
    // Check if the namespace exists and has vectors
    if (indexStats.namespaces && indexStats.namespaces[namespace]) {
      const namespaceStats = indexStats.namespaces[namespace];
      // v6 SDK returns snake_case (vector_count) but tolerate camelCase too
      return (
        namespaceStats.vector_count ||
        namespaceStats.vectorCount ||
        namespaceStats.recordCount ||
        namespaceStats.record_count ||
        0
      ) > 0;
    }
    
    // No vectors anywhere
    return false;
  } catch (error) {
    // If index doesn't exist or there's an error, assume no embeddings
    console.error('Error checking Pinecone embeddings:', error.message);
    return false;
  }
};

module.exports = {
  getPineconeClient,
  getPineconeIndex,
  checkEmbeddingsExist
};
