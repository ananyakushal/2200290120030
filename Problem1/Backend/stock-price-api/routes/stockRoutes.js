// routes/stockRoutes.js - Routes for stock price data
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { validateStockParams } = require('../middleware/validators');

/**
 * @route   GET /:ticker
 * @desc    Get average stock price for a ticker in the last m minutes
 * @access  Public
 * @param   {string} ticker - Stock ticker symbol
 * @param   {number} minutes - Minutes of history to analyze (default: 5)
 * @param   {string} aggregation - Type of aggregation (default: average)
 */
router.get('/:ticker', validateStockParams, stockController.getStockPrice);

module.exports = router;