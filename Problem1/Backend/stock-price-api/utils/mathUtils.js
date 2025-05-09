// utils/mathUtils.js - Mathematical utilities for stock calculations

/**
 * Calculate mean (average) of an array of numbers
 */
const calculateMean = (numbers) => {
    if (!numbers || numbers.length === 0) return 0;
    return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
  };
  
  /**
   * Calculate median of an array of numbers
   */
  const calculateMedian = (numbers) => {
    if (!numbers || numbers.length === 0) return 0;
    
    // Sort the numbers
    const sorted = [...numbers].sort((a, b) => a - b);
    const middleIndex = Math.floor(sorted.length / 2);
    
    // If even length, average the two middle values
    if (sorted.length % 2 === 0) {
      return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
    }
    
    // If odd length, return the middle value
    return sorted[middleIndex];
  };
  
  /**
   * Calculate standard deviation of an array of numbers
   */
  const calculateStandardDeviation = (numbers) => {
    if (!numbers || numbers.length <= 1) {
      return 0; // Standard deviation requires at least 2 data points
    }
    
    const mean = calculateMean(numbers);
    const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / (numbers.length - 1);
    
    return Math.sqrt(variance);
  };
  
  /**
   * Calculate covariance between two arrays of numbers
   */
  const calculateCovariance = (xValues, yValues) => {
    if (!xValues || !yValues || xValues.length !== yValues.length || xValues.length <= 1) {
      return 0;
    }
    
    const xMean = calculateMean(xValues);
    const yMean = calculateMean(yValues);
    
    let sum = 0;
    for (let i = 0; i < xValues.length; i++) {
      sum += (xValues[i] - xMean) * (yValues[i] - yMean);
    }
    
    return sum / (xValues.length - 1);
  };
  
  /**
   * Calculate Pearson correlation coefficient between two arrays
   * Formula: r = cov(X,Y) / (σX * σY)
   */
  exports.calculateCorrelation = (xValues, yValues) => {
    if (!xValues || !yValues || xValues.length !== yValues.length || xValues.length <= 1) {
      return 0;
    }
    
    const xStdDev = calculateStandardDeviation(xValues);
    const yStdDev = calculateStandardDeviation(yValues);
    
    // Cannot calculate correlation if either standard deviation is 0
    if (xStdDev === 0 || yStdDev === 0) {
      return 0;
    }
    
    const covariance = calculateCovariance(xValues, yValues);
    return covariance / (xStdDev * yStdDev);
  };
  
  /**
   * Calculate different aggregations based on type
   */
  exports.calculateAggregation = (numbers, type = 'average') => {
    if (!numbers || numbers.length === 0) return null;
    
    switch (type.toLowerCase()) {
      case 'average':
        return calculateMean(numbers);
      case 'median':
        return calculateMedian(numbers);
      case 'min':
        return Math.min(...numbers);
      case 'max':
        return Math.max(...numbers);
      default:
        return calculateMean(numbers);
    }
  };
  
  /**
   * Time-align price data from two stocks to ensure proper correlation calculation
   * This handles the case where stocks have different data points at different times
   */
  exports.timeAlignPriceData = (stockData1, stockData2) => {
    // Create lookup maps for quick timestamp access
    const stock1Map = new Map();
    const stock2Map = new Map();
    
    // Fill the maps with timestamp -> price entries
    stockData1.forEach(entry => {
      const timestamp = new Date(entry.lastUpdatedAt).getTime();
      stock1Map.set(timestamp, entry);
    });
    
    stockData2.forEach(entry => {
      const timestamp = new Date(entry.lastUpdatedAt).getTime();
      stock2Map.set(timestamp, entry);
    });
    
    // Get all unique timestamps from both stocks
    const allTimestamps = [...new Set([
      ...Array.from(stock1Map.keys()),
      ...Array.from(stock2Map.keys())
    ])].sort();
    
    // Initialize arrays for aligned data
    const aligned1 = [];
    const aligned2 = [];
    
    // Handle the case of very sparse data
    if (allTimestamps.length <= 1) {
      return {
        stock1: stockData1,
        stock2: stockData2
      };
    }
    
    // For each timestamp that has data in at least one stock
    allTimestamps.forEach(timestamp => {
      // Only include timestamps where both stocks have data
      if (stock1Map.has(timestamp) && stock2Map.has(timestamp)) {
        aligned1.push(stock1Map.get(timestamp));
        aligned2.push(stock2Map.get(timestamp));
      }
    });
    
    // If we have too few aligned points, use interpolation
    if (aligned1.length < 2) {
      return interpolateMissingData(stockData1, stockData2, allTimestamps, stock1Map, stock2Map);
    }
    
    return {
      stock1: aligned1,
      stock2: aligned2
    };
  };
  
  /**
   * Advanced interpolation for missing data points
   * Uses linear interpolation to estimate prices at timestamps where data is missing
   */
  const interpolateMissingData = (stockData1, stockData2, allTimestamps, stock1Map, stock2Map) => {
    const result1 = [];
    const result2 = [];
    
    // For each timestamp in chronological order
    for (let i = 0; i < allTimestamps.length; i++) {
      const currentTime = allTimestamps[i];
      
      // Get data for stock 1 at this timestamp (or interpolate)
      if (stock1Map.has(currentTime)) {
        result1.push(stock1Map.get(currentTime));
      } else {
        // Find nearest data points before and after
        const before = findNearest(allTimestamps, currentTime, stock1Map, 'before');
        const after = findNearest(allTimestamps, currentTime, stock1Map, 'after');
        
        if (before && after) {
          // Interpolate between before and after
          const beforePrice = stock1Map.get(before).price;
          const afterPrice = stock1Map.get(after).price;
          const ratio = (currentTime - before) / (after - before);
          const interpolatedPrice = beforePrice + (afterPrice - beforePrice) * ratio;
          
          result1.push({
            price: interpolatedPrice,
            lastUpdatedAt: new Date(currentTime).toISOString(),
            interpolated: true
          });
        } else if (before) {
          // Use the closest before point if after is not available
          result1.push(stock1Map.get(before));
        } else if (after) {
          // Use the closest after point if before is not available
          result1.push(stock1Map.get(after));
        }
      }
      
      // Get data for stock 2 at this timestamp (or interpolate)
      if (stock2Map.has(currentTime)) {
        result2.push(stock2Map.get(currentTime));
      } else {
        // Find nearest data points before and after
        const before = findNearest(allTimestamps, currentTime, stock2Map, 'before');
        const after = findNearest(allTimestamps, currentTime, stock2Map, 'after');
        
        if (before && after) {
          // Interpolate between before and after
          const beforePrice = stock2Map.get(before).price;
          const afterPrice = stock2Map.get(after).price;
          const ratio = (currentTime - before) / (after - before);
          const interpolatedPrice = beforePrice + (afterPrice - beforePrice) * ratio;
          
          result2.push({
            price: interpolatedPrice,
            lastUpdatedAt: new Date(currentTime).toISOString(),
            interpolated: true
          });
        } else if (before) {
          // Use the closest before point if after is not available
          result2.push(stock2Map.get(before));
        } else if (after) {
          // Use the closest after point if before is not available
          result2.push(stock2Map.get(after));
        }
      }
    }
    
    return {
      stock1: result1,
      stock2: result2
    };
  };
  
  /**
   * Find the nearest timestamp in a direction
   */
  const findNearest = (timestamps, target, dataMap, direction) => {
    if (direction === 'before') {
      // Find closest timestamp less than target
      for (let i = timestamps.indexOf(target) - 1; i >= 0; i--) {
        if (dataMap.has(timestamps[i])) {
          return timestamps[i];
        }
      }
    } else {
      // Find closest timestamp greater than target
      for (let i = timestamps.indexOf(target) + 1; i < timestamps.length; i++) {
        if (dataMap.has(timestamps[i])) {
          return timestamps[i];
        }
      }
    }
    
    return null;
  };