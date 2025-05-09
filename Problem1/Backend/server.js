// server.js - Main entry point for our Stock Price Aggregation API
const express = require('express');
const morgan = require('morgan'); // For logging
const helmet = require('helmet'); // For security
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import routes
const stockRoutes = require('./stock-price-api/routes/stockRoutes');
const correlationRoutes = require('./stock-price-api/routes/correlationRoutes');
const { initializeCache } = require('./stock-price-api/services/cacheService');

// Environment variables
const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();

// Initialize cache on startup
initializeCache();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());

// Custom logging format - more human readable
morgan.token('request-summary', (req) => {
  return `${req.method} ${req.url} - ${req.get('user-agent') || 'Unknown UA'}`;
});

// Use custom morgan format for logging
app.use(morgan(':request-summary - :status - :response-time ms'));

// Rate limiting - prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again after a while",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// Register routes
app.use('/stocks', stockRoutes);
app.use('/stockcorrelation', correlationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error occurred: ${err.stack}`);
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      ...(isDevelopment && { stack: err.stack }),
    }
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ 
    error: {
      message: `Resource not found: ${req.originalUrl}`,
      suggestions: [
        'Check the URL and try again',
        'Refer to our API documentation for available endpoints'
      ]
    } 
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`
    Server running on port ${PORT}
  `);
});

module.exports = app; // For testing