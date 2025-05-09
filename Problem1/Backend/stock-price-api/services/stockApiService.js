// services/stockApiService.js - Service for fetching stock data from exchange API
const axios = require('axios');
const createError = require('http-errors');
const { getCachedData, setCachedData } = require('./cacheService');

// Configure API client
const apiClient = axios.create({
  baseURL: process.env.STOCK_API_URL || 'http://stock-exchange-api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'StockAggregationService/1.0'
  }
});

// Exponential backoff retry mechanism for API failures
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await apiClient.get(url, options);
    } catch (error) {
      retries++;
      
      // If we've used all retries, throw the error
      if (retries === maxRetries) {
        throw error;
      }

      // Calculate backoff delay: 2^retries * 300 milliseconds
      const delay = Math.pow(2, retries) * 300;
      console.log(`Retry ${retries}/${maxRetries} for ${url} in ${delay}ms`);
      
      // Wait for the backoff period
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Fetches stock price history from the API
 * Uses smart caching to reduce API calls
 */
exports.fetchStockPriceHistory = async (ticker, minutesBack) => {
  try {
    // Create params object for caching
    const params = { ticker, minutes: minutesBack };
    
    // Check if we have this data cached
    const cachedData = getCachedData('stockHistory', params);
    if (cachedData) {
      console.log(`Cache hit for ${ticker} history data`);
      return cachedData;
    }
    
    console.log(`Fetching price history for ${ticker} for the last ${minutesBack} minutes`);
    
    // Calculate time threshold
    const thresholdTime = new Date();
    thresholdTime.setMinutes(thresholdTime.getMinutes() - minutesBack);
    
    // Make API request
    const response = await fetchWithRetry(`/stocks/${ticker}/history`);
    
    if (!response.data || !response.data.priceHistory || !Array.isArray(response.data.priceHistory)) {
      throw createError(502, 'Invalid response from stock API');
    }
    
    // Filter data for requested time period
    const filteredHistory = response.data.priceHistory
      .filter(entry => new Date(entry.lastUpdatedAt) >= thresholdTime)
      .sort((a, b) => new Date(a.lastUpdatedAt) - new Date(b.lastUpdatedAt));
    
    // Calculate a smart TTL - shorter for more recent data
    // This ensures more frequent updates for volatile short timeframes
    const smartTtl = Math.min(minutesBack * 0.2, 60); // 20% of requested time or max 60 seconds
    
    // Cache the filtered data
    setCachedData('stockHistory', params, filteredHistory, smartTtl);
    
    return filteredHistory;
  } catch (error) {
    console.error(`Error fetching stock history for ${ticker}:`, error.message);
    
    // Transform errors to standard format
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      throw createError(error.response.status, 
        `Stock API error: ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw createError(504, 'Stock Exchange API timeout');
    } else {
      // Something else caused the error
      throw createError(500, `Error fetching stock data: ${error.message}`);
    }
  }
};

/**
 * Fetches current stock price
 */
exports.fetchCurrentStockPrice = async (ticker) => {
  try {
    const params = { ticker };
    
    // Current price should have very short TTL
    const cachedPrice = getCachedData('currentPrice', params);
    if (cachedPrice) {
      return cachedPrice;
    }
    
    const response = await fetchWithRetry(`/stocks/${ticker}/price`);
    
    if (!response.data || typeof response.data.price !== 'number') {
      throw createError(502, 'Invalid price data from stock API');
    }
    
    // Cache current price with short TTL (5 seconds)
    setCachedData('currentPrice', params, response.data, 5);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching current price for ${ticker}:`, error.message);
    throw createError(error.response?.status || 500, 
      `Failed to fetch current price: ${error.message}`);
  }
};