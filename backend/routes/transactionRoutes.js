// backend/routes/transactionRoutes.js
const express = require('express');
const {
  initializeDatabase,
  listTransactions,
  getStatistics,
  getBarChartData,
  getPieChartData,
  getCombinedData
} = require('../controllers/transactionController');

const router = express.Router();

router.route('/initialize').get(initializeDatabase);
router.route('/').get(listTransactions);
router.route('/statistics').get(getStatistics);
router.route('/bar-chart').get(getBarChartData);
router.route('/pie-chart').get(getPieChartData);
router.route('/combined').get(getCombinedData);

module.exports = router;