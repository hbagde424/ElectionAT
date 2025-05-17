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
// const assemblyRoutes = require('./routes/assemblypolygenRoutes'); 
const districtpolygenRoutes = require('./routes/districtpolygenRoutes'); 
const assembliesRoutes = require('./routes/assemblypolygenRoutes'); 
// const parliamentRoutes = require('./routes/parliamentpolygenRoutes'); 
// Import routes
const stateRoutes = require('./routes/stateRoutes');
const divisionRoutes = require('./routes/divisionRoutes');
const parliamentRoutes = require('./routes/parliamentRoutes');
const districtRoutes = require('./routes/districtRoutes');
const assemblyRoutes = require('./routes/assemblyRoutes');
const boothRoutes = require('./routes/boothRoutes');
// const partyRoutes = require('./routes/partyRoutes');
// const electionYearRoutes = require('./routes/electionYearRoutes');
// const blockRoutes = require('./routes/blockRoutes');
// const localDynamicsRoutes = require('./routes/localDynamicsRoutes');
// const votingTrendsRoutes = require('./routes/votingTrendsRoutes');
const boothDemographicsRoutes = require('./routes/boothDemographicsRoutes');
const boothElectionStatsRoutes = require('./routes/boothElectionStatsRoutes');
const boothPartyVoteShareRoutes = require('./routes/boothPartyVoteShareRoutes');
const boothPartyPresenceRoutes = require('./routes/boothPartyPresenceRoutes');

// Add these to your existing imports
const boothVolunteersRoutes = require('./routes/boothVolunteersRoutes');
const boothInfrastructureRoutes = require('./routes/boothInfrastructureRoutes');
const votingTrendsRoutes = require('./routes/votingTrendsRoutes');
const boothAdminRoutes = require('./routes/boothAdminRoutes');

const blockRoutes = require('./routes/blockRoutes');

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
app.use('/api/district', districtpolygenRoutes);
app.use('/api/assembly', assembliesRoutes);

app.use('/api/states', stateRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/parliaments', parliamentRoutes);
app.use('/api/districts', districtRoutes); 
app.use('/api/assemblies', assemblyRoutes);
app.use('/api/booths', boothRoutes);
// app.use('/api/parties', partyRoutes);
// app.use('/api/election-years', electionYearRoutes);
// app.use('/api/blocks', blockRoutes);
// app.use('/api/local-dynamics', localDynamicsR outes);
// app.use('/api/voting-trends', votingTrendsRoutes);
// Add these to your existing route middleware
app.use('/api/booth-demographics', boothDemographicsRoutes);
app.use('/api/booth-election-stats', boothElectionStatsRoutes);
app.use('/api/booth-vote-shares', boothPartyVoteShareRoutes);
app.use('/api/booth-party-presence', boothPartyPresenceRoutes);

app.use('/api/blocks', blockRoutes);




// Add these to your route middleware
app.use('/api/booth-volunteers', boothVolunteersRoutes);
app.use('/api/booth-infrastructure', boothInfrastructureRoutes);
app.use('/api/voting-trends', votingTrendsRoutes);
app.use('/api/booth-admin', boothAdminRoutes);
// Error handler
app.use(errorHandler);

module.exports = app;