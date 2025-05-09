// routes/correlationRoutes.js - Routes for stock correlation data
const express = require('express');
const router = express.Router();
const correlationController = require('../controllers/correlationController');
const { validateCorrelationParams } = require('../middleware/validators');

/**
 * @route   GET /
 * @desc    Get correlation between two stock tickers in the last m minutes
 * @access  Public
 * @param   {string[]} ticker - Array of exactly two stock ticker symbols
 * @param   {number} minutes - Minutes of history to analyze (default: 60)
 */
router.get('/', validateCorrelationParams, correlationController.getStockCorrelation);

module.exports = router;