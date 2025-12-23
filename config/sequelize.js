const { Sequelize } = require('sequelize');

// Parse Supabase database URL if provided
function parseDatabaseUrl(url) {
  if (!url) return null;
  
  try {
    const dbUrl = new URL(url);
    return {
      username: dbUrl.username,
      password: decodeURIComponent(dbUrl.password),
      host: dbUrl.hostname,
      port: dbUrl.port || 5432,
      database: dbUrl.pathname.slice(1) // Remove leading slash
    };
  } catch (error) {
    console.error('Failed to parse SUPABASE_DB_URL:', error.message);
    return null;
  }
}

// Get database configuration
function getDatabaseConfig() {
  // Try Supabase database URL first
  const supabaseDbUrl = process.env.SUPABASE_DB_URL;
  if (supabaseDbUrl) {
    const parsed = parseDatabaseUrl(supabaseDbUrl);
    if (parsed) {
      console.log('Using Supabase database configuration from URL');
      return parsed;
    }
  }

  // Fallback to individual environment variables
  return {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    host: process.env.SUPABASE_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.SUPABASE_DB_PORT || process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'postgres'
  };
}

function createSequelizeInstance() {
  const dbConfig = getDatabaseConfig();
  const isSupabase = dbConfig.host && dbConfig.host.includes('supabase.co');
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('DB Config:', {
    name: dbConfig.database,
    user: dbConfig.username,
    password: dbConfig.password ? '***HIDDEN***' : 'missing',
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    ssl: isSupabase || isProduction ? 'true' : 'false',
    environment: process.env.NODE_ENV,
    isSupabase
  });

  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    String(dbConfig.password || ''),
    {
      host: dbConfig.host,
      port: parseInt(dbConfig.port) || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        // Enable SSL for Supabase or production
        ssl: (isSupabase || isProduction) ? {
          require: true,
          rejectUnauthorized: false,
          mode: 'require'
        } : false,
        connectTimeout: 30000,
        socketTimeout: 30000,
        idleTimeout: 60000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 0
      },
      pool: {
        max: isProduction ? 3 : 5,
        min: 0,
        acquire: 30000,
        idle: 20000,
        evict: 5000,
        maxUses: 100
      },
      query: {
        timeout: 10000
      },
      retry: {
        max: 3,
        backoffBase: 1000,
        backoffExponent: 1.5
      }
    }
  );

  // Add connection validation function
  sequelize.validateConnection = async function() {
    try {
      await this.authenticate();
      return true;
    } catch (err) {
      console.error('Connection validation failed:', err);
      return false;
    }
  };

  return sequelize;
}

// Create initial instance
const sequelize = createSequelizeInstance();

// Export the sequelize instance and functions
sequelize.createSequelizeInstance = createSequelizeInstance;

module.exports = sequelize;
