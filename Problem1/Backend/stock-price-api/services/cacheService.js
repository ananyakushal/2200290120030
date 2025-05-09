// services/cacheService.js - Smart caching mechanism for stock data
const NodeCache = require('node-cache');

// Create cache instances with different TTLs
// Using multiple caches with different expiration times for different types of data
const shortTermCache = new NodeCache({ 
  stdTTL: 10,          // Very recent data (10 seconds)
  checkperiod: 5,      // Check for expired keys every 5 seconds
  useClones: false     // Store references for better performance
});

const mediumTermCache = new NodeCache({ 
  stdTTL: 60,          // Medium freshness data (1 minute)
  checkperiod: 30,     // Check expired keys every 30 seconds
  useClones: false
});

const longTermCache = new NodeCache({ 
  stdTTL: 300,         // Historical data (5 minutes)
  checkperiod: 150,    // Check expired keys every 2.5 minutes
  useClones: false
});

/**
 * Cache key generator
 * Creates consistent keys for caching based on parameters
 */
const createCacheKey = (type, params) => {
  switch (type) {
    case 'stockPrice':
      return `stock:${params.ticker}:${params.minutes}:${params.aggregation}`;
    case 'stockHistory':
      return `history:${params.ticker}:${params.minutes}`;
    case 'correlation':
      return `corr:${params.tickers.sort().join('_')}:${params.minutes}`;
    default:
      return `${type}:${JSON.stringify(params)}`;
  }
};

/**
 * Determines which cache to use based on data freshness needs
 */
const getCacheForType = (type, minutes) => {
  // Very recent data needs more frequent updates
  if (minutes <= 5) {
    return shortTermCache;
  }
  // Medium term data (5-30 minutes)
  else if (minutes <= 30) {
    return mediumTermCache;
  }
  // Historical data can be cached longer
  else {
    return longTermCache;
  }
};

/**
 * Gets data from appropriate cache
 */
const getCachedData = (type, params) => {
  const key = createCacheKey(type, params);
  const cache = getCacheForType(type, params.minutes);
  return cache.get(key);
};

/**
 * Stores data in appropriate cache
 * TTL can be overridden for special cases
 */
const setCachedData = (type, params, data, ttl = null) => {
  const key = createCacheKey(type, params);
  const cache = getCacheForType(type, params.minutes);
  return cache.set(key, data, ttl);
};

/**
 * Invalidates cache entries by pattern
 * Useful for removing all data for a specific stock
 */
const invalidateCache = (pattern) => {
  const caches = [shortTermCache, mediumTermCache, longTermCache];
  let invalidatedCount = 0;
  
  caches.forEach(cache => {
    const keys = cache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.del(key);
        invalidatedCount++;
      }
    });
  });
  
  return invalidatedCount;
};

/**
 * Initialize cache - can be used to pre-warm cache with popular stocks
 */
const initializeCache = () => {
  // Could pre-fetch popular stocks on startup
  console.log('Cache service initialized');
  
  // Periodic cleanup to prevent memory leaks
  setInterval(() => {
    const stats = {
      short: shortTermCache.getStats(),
      medium: mediumTermCache.getStats(),
      long: longTermCache.getStats()
    };
    
    console.log(`Cache stats - Keys: short=${stats.short.keys}, medium=${stats.medium.keys}, long=${stats.long.keys}`);
  }, 60000); // Log stats every minute
};

// Cache events for monitoring
shortTermCache.on('expired', (key, value) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Cache key expired: ${key}`);
  }
});

module.exports = {
  getCachedData,
  setCachedData,
  invalidateCache,
  createCacheKey,
  initializeCache
};