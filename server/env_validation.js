// Add this to index.js after dotenv.config() and before startServer()

// Validate critical environment variables
console.log('\n🔍 ENVIRONMENT VARIABLES CHECK:');
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ MISSING ENVIRONMENT VARIABLES:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  
  if (process.env.NODE_ENV === 'production') {
    console.error('\n💥 CRITICAL: Missing environment variables in production. Exiting...\n');
    process.exit(1);
  } else {
    console.warn('\n⚠️  WARNING: Missing environment variables in development mode\n');
  }
} else {
  console.log('✅ All required environment variables are set\n');
}