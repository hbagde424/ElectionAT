const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/db');

// Route files
const authRoutes = require('./routes/authRoutes');
const mapRoutes = require('./routes/mapRoutes');

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Enable CORS
// const cors = require('cors');

// Enable CORS with specific options
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));

// Set security headers
app.use(helmet());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/map', mapRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;