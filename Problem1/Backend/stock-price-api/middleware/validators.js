// middleware/validators.js - Request validation middleware
const createError = require('http-errors');

/**
 * Validates stock API parameters
 */
exports.validateStockParams = (req, res, next) => {
  try {
    // Validate ticker
    const ticker = req.params.ticker;
    if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
      return next(createError(400, 'Valid stock ticker symbol is required'));
    }
    
    // Validate minutes parameter
    const minutes = parseInt(req.query.minutes) || 5; // Default to 5 minutes
    if (isNaN(minutes) || minutes <= 0 || minutes > 1440) { // Max 24 hours (1440 min)
      return next(createError(400, 'Minutes must be a positive number up to 1440'));
    }
    
    // Validate aggregation type
    const aggregation = req.query.aggregation || 'average';
    const validAggregations = ['average', 'median', 'min', 'max'];
    if (!validAggregations.includes(aggregation)) {
      return next(createError(400, `Aggregation must be one of: ${validAggregations.join(', ')}`));
    }
    
    // Store validated values on req object
    req.validatedParams = {
      ticker: ticker.toUpperCase(), // Standardize to uppercase
      minutes,
      aggregation
    };
    
    next();
  } catch (err) {
    next(createError(400, 'Invalid request parameters'));
  }
};

/**
 * Validates correlation API parameters
 */
exports.validateCorrelationParams = (req, res, next) => {
  try {
    // Get ticker parameters (expected as array)
    const tickers = Array.isArray(req.query.ticker) ? req.query.ticker : [req.query.ticker];
    
    // Validate we have exactly 2 tickers
    if (!tickers || tickers.length !== 2 || tickers.includes(undefined)) {
      return next(createError(400, 'Exactly two stock ticker symbols are required'));
    }
    
    // Ensure both tickers are valid strings
    if (tickers.some(t => typeof t !== 'string' || t.trim() === '')) {
      return next(createError(400, 'Invalid ticker format provided'));
    }
    
    // Validate minutes parameter
    const minutes = parseInt(req.query.minutes) || 60; // Default to 60 minutes
    if (isNaN(minutes) || minutes <= 0 || minutes > 1440) { // Max 24 hours
      return next(createError(400, 'Minutes must be a positive number up to 1440'));
    }
    
    // Store validated values on req object
    req.validatedParams = {
      tickers: tickers.map(t => t.toUpperCase()), // Convert to uppercase
      minutes
    };
    
    next();
  } catch (err) {
    next(createError(400, 'Invalid request parameters'));
  }
};