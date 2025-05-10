const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/db');
const { specs, swaggerUi } = require('./config/swagger'); // Add this line

// Route files
const authRoutes = require('./routes/authRoutes');
const mapRoutes = require('./routes/mapRoutes'); 
const assemblyRoutes = require('./routes/assemblyRoutes'); 
const districtRoutes = require('./routes/districtRoutes'); 
const divisionRoutes = require('./routes/divisionRoutes'); 
const parliamentRoutes = require('./routes/parliamentRoutes'); 

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
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Set security headers
app.use(helmet());

// Add Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Body parser with increased limit
app.use(express.json({ limit: '50mb' })); // Add this line
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/assembly', assemblyRoutes);
app.use('/api/district', districtRoutes);
app.use('/api/division', divisionRoutes);
app.use('/api/parliament', parliamentRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;