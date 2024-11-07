// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDatabase = require('./config/db');
const transactionRoutes = require('./routes/transactionRoutes');

dotenv.config();
connectDatabase();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, console.log(`Server running on port ${PORT}`));