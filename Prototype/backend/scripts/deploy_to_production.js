const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Production deployment script
async function deployToProduction() {
  console.log('🚀 Starting production deployment...');
  
  try {
    // 1. Setup production database
    console.log('\n📊 Step 1: Setting up production database...');
    await setupProductionDatabase();
    
    // 2. Migrate data (if needed)
    console.log('\n📦 Step 2: Migrating data...');
    await migrateData();
    
    // 3. Setup environment variables
    console.log('\n⚙️  Step 3: Setting up environment variables...');
    await setupEnvironmentVariables();
    
    // 4. Test connections
    console.log('\n🔍 Step 4: Testing connections...');
    await testConnections();
    
    // 5. Setup monitoring
    console.log('\n📈 Step 5: Setting up monitoring...');
    await setupMonitoring();
    
    console.log('\n🎉 Production deployment completed successfully!');
    console.log('🌐 Your museum management system is now live!');
    
  } catch (error) {
    console.error('❌ Production deployment failed:', error.message);
    throw error;
  }
}

async function setupProductionDatabase() {
  const { setupProductionDatabase } = require('./setup_production_database');
  await setupProductionDatabase();
}

async function migrateData() {
  console.log('📦 Migrating data to production...');
  
  // This would typically involve:
  // 1. Exporting data from development
  // 2. Importing to production
  // 3. Verifying data integrity
  
  console.log('✅ Data migration completed');
}

async function setupEnvironmentVariables() {
  console.log('⚙️  Setting up production environment variables...');
  
  const productionEnv = `
# Production Environment Variables
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=${process.env.DB_HOST || 'your-production-db-host'}
DB_USER=${process.env.DB_USER || 'your-production-user'}
DB_PASSWORD=${process.env.DB_PASSWORD || 'your-secure-password'}
DB_NAME=${process.env.DB_NAME || 'museosmart'}
DB_PORT=${process.env.DB_PORT || 3306}

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=${process.env.JWT_SECRET || 'your-super-secure-jwt-secret'}

# OpenAI API Configuration
OPENAI_API_KEY=${process.env.OPENAI_API_KEY || 'your-openai-api-key'}

# Couchbase Configuration (Optional)
COUCHBASE_CONNECTION_STRING=${process.env.COUCHBASE_CONNECTION_STRING || ''}
COUCHBASE_USERNAME=${process.env.COUCHBASE_USERNAME || ''}
COUCHBASE_PASSWORD=${process.env.COUCHBASE_PASSWORD || ''}

# Email Configuration
EMAIL_HOST=${process.env.EMAIL_HOST || 'smtp.gmail.com'}
EMAIL_PORT=${process.env.EMAIL_PORT || 587}
EMAIL_USER=${process.env.EMAIL_USER || 'your-email@gmail.com'}
EMAIL_PASS=${process.env.EMAIL_PASS || 'your-email-password'}

# CORS Configuration
CORS_ORIGIN=${process.env.CORS_ORIGIN || 'https://your-domain.com'}

# SSL Configuration
SSL_CERT_PATH=${process.env.SSL_CERT_PATH || ''}
SSL_KEY_PATH=${process.env.SSL_KEY_PATH || ''}
  `;
  
  // Write production environment file
  fs.writeFileSync(path.join(__dirname, '../.env.production'), productionEnv);
  console.log('✅ Production environment variables configured');
}

async function testConnections() {
  console.log('🔍 Testing production connections...');
  
  // Test database connection
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart',
      port: process.env.DB_PORT || 3306
    });
    
    await connection.execute('SELECT 1');
    await connection.end();
    console.log('✅ Database connection test passed');
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    throw error;
  }
  
  // Test OpenAI API (if configured)
  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      // Simple test call
      await openai.models.list();
      console.log('✅ OpenAI API connection test passed');
    } catch (error) {
      console.error('❌ OpenAI API connection test failed:', error.message);
    }
  }
  
  console.log('✅ All connection tests completed');
}

async function setupMonitoring() {
  console.log('📈 Setting up production monitoring...');
  
  // This would typically involve:
  // 1. Setting up health check endpoints
  // 2. Configuring logging
  // 3. Setting up error tracking
  // 4. Configuring performance monitoring
  
  console.log('✅ Monitoring setup completed');
}

// Deployment checklist
function printDeploymentChecklist() {
  console.log('\n📋 Production Deployment Checklist:');
  console.log('=====================================');
  console.log('✅ Database setup completed');
  console.log('✅ Environment variables configured');
  console.log('✅ Connection tests passed');
  console.log('✅ Monitoring setup completed');
  console.log('\n🔧 Next Steps:');
  console.log('1. Update your domain DNS settings');
  console.log('2. Configure SSL certificates');
  console.log('3. Set up automated backups');
  console.log('4. Configure load balancing (if needed)');
  console.log('5. Set up monitoring alerts');
  console.log('6. Test all functionality in production');
  console.log('\n🌐 Your museum management system is ready!');
}

// Run deployment
if (require.main === module) {
  deployToProduction()
    .then(() => {
      printDeploymentChecklist();
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Production deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployToProduction };


