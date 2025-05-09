// config/index.js - Configuration management
const path = require('path');

// Try to load environment variables from .env file if not in production
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  } catch (error) {
    console.warn('No .env file found or dotenv not installed');
  }
}

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  
  // Stock API configuration
  stockApi: {
    baseUrl: process.env.STOCK_API_URL || 'http://stock-exchange-api',
    timeout: parseInt(process.env.API_TIMEOUT) || 5000,
    retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 3
  },
  
  // Cache configuration
  cache: {
    // Short-term cache for very recent data (seconds)
    shortTerm: {
      ttl: parseInt(process.env.SHORT_CACHE_TTL) || 10,
      checkPeriod: parseInt(process.env.SHORT_CACHE_CHECK) || 5
    },
    // Medium-term cache (seconds)
    mediumTerm: {
      ttl: parseInt(process.env.MEDIUM_CACHE_TTL) || 60,
      checkPeriod: parseInt(process.env.MEDIUM_CACHE_CHECK) || 30
    },
    // Long-term cache for historical data (seconds)
    longTerm: {
      ttl: parseInt(process.env.LONG_CACHE_TTL) || 300,
      checkPeriod: parseInt(process.env.LONG_CACHE_CHECK) || 150
    }
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // limit each IP to 100 requests per windowMs
  }
};