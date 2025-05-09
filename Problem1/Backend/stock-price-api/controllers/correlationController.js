// controllers/correlationController.js - Handler for stock correlation endpoints
const createError = require('http-errors');
const { fetchStockPriceHistory } = require('../services/stockApiService');
const { getCachedData, setCachedData } = require('../services/cacheService');
const { calculateCorrelation, calculateAggregation, timeAlignPriceData } = require('../utils/mathUtils');

/**
 * Get correlation between two stocks
 */
exports.getStockCorrelation = async (req, res, next) => {
  try {
    // Get validated parameters
    const { tickers, minutes } = req.validatedParams;
    
    // Check if we have cached results
    const cacheParams = { tickers, minutes };
    const cachedResult = getCachedData('correlation', cacheParams);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    // We need two distinct tickers
    if (tickers[0] === tickers[1]) {
      return next(createError(400, 'Cannot calculate correlation between the same stock'));
    }
    
    // Fetch historical price data for both stocks
    const [stockData1, stockData2] = await Promise.all([
      fetchStockPriceHistory(tickers[0], minutes),
      fetchStockPriceHistory(tickers[1], minutes)
    ]);
    
    // Handle case with insufficient data
    if (!stockData1?.length || !stockData2?.length) {
      return next(createError(404, `Insufficient data for one or both stocks in the last ${minutes} minutes`));
    }
    
    // We need data points for correlation
    if (stockData1.length < 2 || stockData2.length < 2) {
      return next(createError(400, `Need at least 2 data points per stock for correlation. Available: ${tickers[0]}=${stockData1.length}, ${tickers[1]}=${stockData2.length}`));
    }
    
    // Time-align the price data for accurate correlation
    const alignedData = timeAlignPriceData(stockData1, stockData2);
    
    // Calculate correlation
    const correlation = calculateCorrelation(
      alignedData.stock1.map(p => p.price),
      alignedData.stock2.map(p => p.price)
    );
    
    // Calculate average prices
    const averagePrice1 = calculateAggregation(stockData1.map(p => p.price), 'average');
    const averagePrice2 = calculateAggregation(stockData2.map(p => p.price), 'average');
    
    // Prepare response
    const result = {
      correlation: parseFloat(correlation.toFixed(4)), // Round to 4 decimal places
      stocks: {
        [tickers[0]]: {
          averagePrice: averagePrice1,
          priceHistory: stockData1
        },
        [tickers[1]]: {
          averagePrice: averagePrice2,
          priceHistory: stockData2
        }
      }
    };
    
    // Cache the result
    const cacheTtl = Math.min(Math.max(minutes * 0.1, 10), 60);
    setCachedData('correlation', cacheParams, result, cacheTtl);
    
    // Send response
    return res.json(result);
  } catch (err) {
    console.error(`Error in getStockCorrelation: ${err.message}`);
    
    // Pass error to error handler
    next(err.status ? err : createError(500, `Failed to calculate correlation: ${err.message}`));
  }
};