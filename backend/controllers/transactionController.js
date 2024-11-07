// backend/controllers/transactionController.js
const https = require('https');
const Transaction = require('../models/Transaction');
const ApiFeatures = require('../utils/apiFeatures');

// Helper function to make HTTPS requests
const httpsGet = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Initialize database
exports.initializeDatabase = async (req, res) => {
  try {
    const data = await httpsGet('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    await Transaction.insertMany(data);
    res.status(200).json({ message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error initializing database', error: error.message });
  }
};

// The rest of the controller functions remain the same
// ...
// List all transactions
exports.listTransactions = async (req, res) => {
  try {
    const { month, page = 1, limit = 10, search = '' } = req.query;
    const startDate = new Date(`2023-${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);

    let query = {
      dateOfSale: { $gte: startDate, $lte: endDate }
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: isNaN(search) ? undefined : Number(search) }
      ].filter(Boolean);
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ dateOfSale: 1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      data: transactions,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

// Get statistics
exports.getStatistics = async (req, res) => {
  try {
    const { month } = req.query;
    const startDate = new Date(`2023-${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const totalSaleAmount = await Transaction.aggregate([
      { $match: { dateOfSale: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    const soldItems = await Transaction.countDocuments({ 
      dateOfSale: { $gte: startDate, $lte: endDate },
      sold: true
    });

    const notSoldItems = await Transaction.countDocuments({ 
      dateOfSale: { $gte: startDate, $lte: endDate },
      sold: false
    });

    res.status(200).json({
      totalSaleAmount: totalSaleAmount[0]?.total || 0,
      soldItems,
      notSoldItems
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

// Get bar chart data
exports.getBarChartData = async (req, res) => {
  try {
    const { month } = req.query;
    const startDate = new Date(`2023-${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const ranges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Infinity }
    ];

    const barChartData = await Promise.all(ranges.map(async (range) => {
      const count = await Transaction.countDocuments({
        dateOfSale: { $gte: startDate, $lte: endDate },
        price: { $gte: range.min, $lt: range.max }
      });
      return { range: `${range.min}-${range.max === Infinity ? 'above' : range.max}`, count };
    }));

    res.status(200).json(barChartData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bar chart data', error: error.message });
  }
};

// Get pie chart data
exports.getPieChartData = async (req, res) => {
  try {
    const { month } = req.query;
    const startDate = new Date(`2023-${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const pieChartData = await Transaction.aggregate([
      { $match: { dateOfSale: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);

    res.status(200).json(pieChartData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pie chart data', error: error.message });
  }
};

// Combined data
exports.getCombinedData = async (req, res) => {
  try {
    const { month } = req.query;
    
    const statistics = await this.getStatistics({ query: { month } }, { json: (data) => data });
    const barChartData = await this.getBarChartData({ query: { month } }, { json: (data) => data });
    const pieChartData = await this.getPieChartData({ query: { month } }, { json: (data) => data });

    res.status(200).json({
      statistics,
      barChartData,
      pieChartData
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching combined data', error: error.message });
  }
};