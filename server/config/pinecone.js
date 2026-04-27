const { Pinecone } = require('@pinecone-database/pinecone');

let pc = null;
// Cached index host — resolved once at startup, avoids repeated control-plane DNS lookups
let resolvedIndexHost = process.env.PINECONE_INDEX_HOST || null;

function getPineconeClient() {
  if (!pc) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }
    pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return pc;
}

/**
 * Resolve the index host once via describeIndex(), then cache it.
 * Explicit host pinning bypasses the control-plane DNS lookup that causes
 * intermittent "Request failed to reach Pinecone" errors.
 */
async function resolveIndexHost(indexName) {
  if (resolvedIndexHost) return resolvedIndexHost;
  try {
    const client = getPineconeClient();
    const desc = await client.describeIndex(indexName);
    resolvedIndexHost = desc?.host ?? null;
    if (resolvedIndexHost) {
      console.log(`Pinecone index host resolved: ${resolvedIndexHost}`);
    }
  } catch (e) {
    console.warn('Could not resolve Pinecone index host, using name-only fallback:', e.message);
  }
  return resolvedIndexHost;
}

/**
 * Returns a Pinecone index handle with the host explicitly pinned.
 * Falls back to name-only if host resolution fails.
 */
function getPineconeIndex(indexName = null) {
  const client = getPineconeClient();
  const name = indexName || process.env.PINECONE_INDEX_NAME || 'vitalsense';
  // Pass host as second arg when available — SDK v6 accepts pc.index(name, host)
  return resolvedIndexHost
    ? client.index(name, resolvedIndexHost)
    : client.index(name);
}

/**
 * Returns a namespace-scoped Pinecone index handle.
 * All queries/upserts through this handle are automatically scoped to the namespace.
 */
function getNamespacedIndex(namespace = 'biomarker-definitions', indexName = null) {
  return getPineconeIndex(indexName).namespace(namespace);
}

/**
 * Retry wrapper — retries up to `attempts` times with exponential back-off.
 * Handles transient network errors without crashing.
 */
async function withRetry(fn, attempts = 3, delayMs = 500) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Check if embeddings exist in Pinecone.
 * Resolves the index host first, then queries with retry.
 */
const checkEmbeddingsExist = async (namespace = 'biomarker-definitions') => {
  try {
    if (!process.env.PINECONE_API_KEY) return false;

    const indexName = process.env.PINECONE_INDEX_NAME || 'vitalsense';

    // Ensure host is resolved before the stats call
    await resolveIndexHost(indexName);

    const indexStats = await withRetry(() => getPineconeIndex(indexName).describeIndexStats());

    // Namespace-first check (SDK v6 returns recordCount)
    const nsStats = indexStats?.namespaces?.[namespace];
    const nsCount =
      nsStats?.recordCount ??
      nsStats?.record_count ??
      nsStats?.vectorCount ??
      nsStats?.vector_count ??
      0;

    if (nsCount > 0) {
      console.log(`Pinecone namespace "${namespace}": ${nsCount} records found.`);
      return true;
    }

    // Fallback: any records in the index
    const totalCount =
      indexStats?.totalRecordCount ??
      indexStats?.total_record_count ??
      indexStats?.totalVectorCount ??
      indexStats?.total_vector_count ??
      0;

    if (totalCount > 0) {
      console.warn(`Pinecone namespace "${namespace}" not found, but index has ${totalCount} total records.`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking Pinecone embeddings:', error.message);
    return false;
  }
};

module.exports = {
  getPineconeClient,
  getPineconeIndex,
  getNamespacedIndex,
  checkEmbeddingsExist,
  resolveIndexHost
};
