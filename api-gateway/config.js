const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'sportsvest_secret_key_change_in_production',
    expiresIn: '7d'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Microservice URLs
  services: {
    user: process.env.USER_SERVICE_URL || 'http://localhost:5001',
    team: process.env.TEAM_SERVICE_URL || 'http://localhost:5002',
    trading: process.env.TRADING_SERVICE_URL || 'http://localhost:5003',
    community: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:5004',
    rewards: process.env.REWARDS_SERVICE_URL || 'http://localhost:5005'
  },
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'sportsvest',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  }
};

module.exports = config;
