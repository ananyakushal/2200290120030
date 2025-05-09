// mock-server/server.js - Mock server to simulate stock exchange API
const express = require('express');
const cors = require('cors');
const { randomStockData, generatePriceHistory } = require('./mockData');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Store some mock data with realistic variations
const stockData = {
  'AAPL': { name: 'Apple Inc.', sector: 'Technology', basePrice: 175.50 },
  'MSFT': { name: 'Microsoft Corp.', sector: 'Technology', basePrice: 320.75 },
  'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology', basePrice: 135.60 },
  'AMZN': { name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', basePrice: 131.25 },
  'TSLA': { name: 'Tesla Inc.', sector: 'Automotive', basePrice: 245.30 },
  'META': { name: 'Meta Platforms Inc.', sector: 'Technology', basePrice: 325.15 },
  'NVDA': { name: 'NVIDIA Corp.', sector: 'Technology', basePrice: 450.80 },
  'PYPL': { name: 'PayPal Holdings Inc.', sector: 'Financial Services', basePrice: 62.50 },
  'NFLX': { name: 'Netflix Inc.', sector: 'Communication Services', basePrice: 385.40 }
};

// Get current stock price
app.get('/stocks/:ticker/price', (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  
  if (!stockData[ticker]) {
    return res.status(404).json({ error: `Stock ticker ${ticker} not found` });
  }
  
  // Simulate some network delay (50-300ms)
  setTimeout(() => {
    // Get current price with some randomness
    const currentPrice = randomStockData(stockData[ticker].basePrice);
    
    res.json({
      ticker,
      price: currentPrice,
      lastUpdatedAt: new Date().toISOString()
    });
  }, Math.floor(Math.random() * 250) + 50);
});

// Get stock price history
app.get('/stocks/:ticker/history', (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  
  if (!stockData[ticker]) {
    return res.status(404).json({ error: `Stock ticker ${ticker} not found` });
  }
  
  // Generate price history with appropriate variance
  const history = generatePriceHistory(ticker, stockData[ticker].basePrice);
  
  // Simulate some network delay (100-500ms)
  setTimeout(() => {
    res.json({
      ticker,
      priceHistory: history
    });
  }, Math.floor(Math.random() * 400) + 100);
});

// List available stocks
app.get('/stocks', (req, res) => {
  const stockList = Object.entries(stockData).map(([ticker, data]) => ({
    ticker,
    name: data.name,
    sector: data.sector
  }));
  
  res.json({ stocks: stockList });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock Stock Exchange API running on port ${PORT}`);
});