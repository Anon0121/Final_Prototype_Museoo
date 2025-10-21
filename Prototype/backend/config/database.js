// Database configuration for multiple environments
const mysql = require('mysql2/promise');
const couchbase = require('couchbase');

class DatabaseManager {
  constructor() {
    this.mysqlPool = null;
    this.couchbaseCluster = null;
    this.environment = process.env.NODE_ENV || 'development';
  }

  // Initialize MySQL connection
  async initMySQL() {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    this.mysqlPool = mysql.createPool(config);
    
    // Test connection
    try {
      const connection = await this.mysqlPool.getConnection();
      console.log('✅ MySQL connected successfully');
      connection.release();
    } catch (err) {
      console.error('❌ MySQL connection error:', err.message);
    }

    return this.mysqlPool;
  }

  // Initialize Couchbase connection
  async initCouchbase() {
    if (!process.env.COUCHBASE_CONNECTION_STRING) {
      console.log('⚠️  Couchbase not configured, using MySQL only');
      return null;
    }

    try {
      this.couchbaseCluster = await couchbase.connect(
        process.env.COUCHBASE_CONNECTION_STRING,
        {
          username: process.env.COUCHBASE_USERNAME,
          password: process.env.COUCHBASE_PASSWORD,
        }
      );
      
      console.log('✅ Couchbase connected successfully');
      return this.couchbaseCluster;
    } catch (err) {
      console.error('❌ Couchbase connection error:', err.message);
      return null;
    }
  }

  // Get MySQL connection
  getMySQL() {
    return this.mysqlPool;
  }

  // Get Couchbase connection
  getCouchbase() {
    return this.couchbaseCluster;
  }

  // Store AI insights in Couchbase
  async storeAIInsights(reportId, insights) {
    if (!this.couchbaseCluster) {
      console.log('⚠️  Couchbase not available, storing in MySQL');
      return this.storeInMySQL(reportId, insights);
    }

    try {
      const bucket = this.couchbaseCluster.bucket('museosmart');
      const collection = bucket.defaultCollection();
      
      await collection.upsert(`ai_insights_${reportId}`, {
        reportId,
        insights,
        timestamp: new Date(),
        environment: this.environment
      });
      
      console.log('✅ AI insights stored in Couchbase');
    } catch (err) {
      console.error('❌ Error storing AI insights:', err.message);
    }
  }

  // Store in MySQL as fallback
  async storeInMySQL(reportId, insights) {
    try {
      await this.mysqlPool.query(
        'INSERT INTO ai_insights (report_id, insights, created_at) VALUES (?, ?, NOW())',
        [reportId, JSON.stringify(insights)]
      );
      console.log('✅ AI insights stored in MySQL');
    } catch (err) {
      console.error('❌ Error storing in MySQL:', err.message);
    }
  }
}

module.exports = new DatabaseManager();


