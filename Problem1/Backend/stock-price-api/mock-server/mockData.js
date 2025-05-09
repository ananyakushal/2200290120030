// mock-server/mockData.js - Generates realistic mock stock data

/**
 * Generate a random stock price with realistic variations
 * @param {number} basePrice - The base price of the stock
 * @returns {number} - A randomized current price
 */
exports.randomStockData = (basePrice) => {
    // Max 5% deviation from base price
    const maxDeviation = basePrice * 0.05;
    // Random value between -maxDeviation and +maxDeviation
    const deviation = (Math.random() * 2 - 1) * maxDeviation;
    // Apply deviation to base price and round to 2 decimal places
    return parseFloat((basePrice + deviation).toFixed(2));
  };
  
  /**
   * Generate price history with realistic trends and patterns
   * @param {string} ticker - Stock ticker symbol
   * @param {number} basePrice - Base stock price
   * @param {number} entries - Number of history entries to generate
   * @returns {Array} - Array of price history objects
   */
  exports.generatePriceHistory = (ticker, basePrice, entries = 20) => {
    const history = [];
    const now = new Date();
    
    // Start with a price that's around the base price
    let currentPrice = basePrice * (0.95 + Math.random() * 0.1);
    
    // Get trend characteristics based on ticker
    // This creates different patterns for different stocks
    const trendType = getTrendTypeForTicker(ticker);
    
    for (let i = 0; i < entries; i++) {
      // Calculate a timestamp in the past
      // More recent entries are more likely to be included
      // exponential distribution - more recent times have higher probability
      const minutesAgo = Math.floor(Math.random() * Math.random() * 120);
      const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);
      
      // Apply price movement based on trend type
      currentPrice = applyTrendMovement(currentPrice, trendType, minutesAgo);
      
      // Ensure price is positive and round to 5 decimal places
      currentPrice = Math.max(currentPrice, 0.01);
      currentPrice = parseFloat(currentPrice.toFixed(5));
      
      // Add to history
      history.push({
        price: currentPrice,
        lastUpdatedAt: timestamp.toISOString()
      });
    }
    
    // Sort by timestamp (oldest to newest)
    return history.sort((a, b) => 
      new Date(a.lastUpdatedAt).getTime() - new Date(b.lastUpdatedAt).getTime()
    );
  };
  
  /**
   * Determine trend characteristics based on ticker symbol
   * This creates different behaviors for different stocks
   */
  function getTrendTypeForTicker(ticker) {
    // Use ticker to seed a consistent trend type
    const tickerSum = ticker.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    // Different trend types:
    const trendTypes = [
      { name: 'upward', volatility: 0.02, bias: 0.001 },      // Generally rising
      { name: 'downward', volatility: 0.018, bias: -0.001 },  // Generally falling
      { name: 'volatile', volatility: 0.04, bias: 0 },        // High volatility, neutral
      { name: 'stable', volatility: 0.005, bias: 0 },         // Low volatility
      { name: 'cyclical', volatility: 0.01, bias: 0, cycle: true } // Cycles up and down
    ];
    
    return trendTypes[tickerSum % trendTypes.length];
  }
  
  /**
   * Apply trend-based price movement
   */
  function applyTrendMovement(price, trendType, minutesAgo) {
    // Base volatility - percentage that price can change
    let volatility = trendType.volatility;
    
    // Random movement within volatility range
    let movement = (Math.random() * 2 - 1) * volatility * price;
    
    // Apply trend bias
    movement += price * trendType.bias;
    
    // Apply cyclical pattern if applicable
    if (trendType.cycle) {
      // Create a sine wave pattern
      const cyclePosition = (minutesAgo % 60) / 60; // Position in cycle (0 to 1)
      const cycleFactor = Math.sin(cyclePosition * Math.PI * 2) * 0.01;
      movement += price * cycleFactor;
    }
    
    return price + movement;
  }
  
  /**
   * Generate a package.json file for the mock server
   */
  exports.generatePackageJson = () => {
    return {
      "name": "stock-exchange-mock-api",
      "version": "1.0.0",
      "description": "Mock API server for stock exchange data",
      "main": "server.js",
      "scripts": {
        "start": "node server.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5"
      }
    };
  };