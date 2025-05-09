// controllers/stockController.js - Handler for stock price endpoints
const createError = require('http-errors');
const { fetchStockPriceHistory } = require('../services/stockApiService');
const { getCachedData, setCachedData } = require('../services/cacheService');
const { calculateAggregation } = require('../utils/mathUtils');

/**
 * Get stock price with aggregation over a time period
 */
exports.getStockPrice = async (req, res, next) => {
  try {
    // Get validated parameters
    const { ticker, minutes, aggregation } = req.validatedParams;
    
    // Check if we have cached results
    const cacheParams = { ticker, minutes, aggregation };
    const cachedResult = getCachedData('stockPrice', cacheParams);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    // Fetch price history from API service
    const priceHistory = await fetchStockPriceHistory(ticker, minutes);
    
    // Handle case with no data
    if (!priceHistory || priceHistory.length === 0) {
      return res.json({
        averageStockPrice: null,
        priceHistory: []
      });
    }
    
    // Extract prices for aggregation calculation
    const prices = priceHistory.map(entry => entry.price);
    
    // Calculate the aggregation based on type
    const aggregatedPrice = calculateAggregation(prices, aggregation);
    
    // Prepare response
    const result = {
      averageStockPrice: aggregatedPrice,
      priceHistory: priceHistory
    };
    
    // Cache the result - TTL based on how recent the data is
    // More recent = shorter TTL
    const cacheTtl = Math.min(Math.max(minutes * 0.1, 5), 30);
    setCachedData('stockPrice', cacheParams, result, cacheTtl);
    
    // Send response
    return res.json(result);
  } catch (err) {
    console.error(`Error in getStockPrice: ${err.message}`);
    
    // Pass error to error handler
    next(err.status ? err : createError(500, `Failed to process stock data: ${err.message}`));
  }
};