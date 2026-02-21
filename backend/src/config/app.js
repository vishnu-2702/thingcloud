/**
 * Application Configuration
 * Central configuration for the IoT Platform
 */

require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`  ${varName}`);
  });
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Required environment variables missing');
  }
  process.exit(1);
}

// Validate JWT Secret strength
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security');
}

const config = {
  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // AWS Configuration
  AWS: {
    REGION: process.env.AWS_REGION || 'us-east-1',
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
  },
  
  // JWT Configuration
  JWT: {
    SECRET: process.env.JWT_SECRET,
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // CORS Configuration
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    CREDENTIALS: process.env.CORS_CREDENTIALS === 'true'
  },
  
  // Security Configuration
  SECURITY: {
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10mb'
  },
  
  // Socket.IO Configuration
  SOCKET: {
    CORS_ORIGIN: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    CORS_METHODS: (process.env.SOCKET_CORS_METHODS || 'GET,POST').split(',')
  },
  
  // Logging Configuration
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    FORMAT: process.env.LOG_FORMAT || (process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
  },
  
  // Production flags
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_VERCEL: !!process.env.VERCEL
};

module.exports = config;