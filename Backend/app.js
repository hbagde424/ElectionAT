const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/db');
const { specs, swaggerUi } = require('./config/swagger');
const utilsRoutes = require("./routes/utilsRoutes");
// Route files
const authRoutes = require('./routes/authRoutes');
//const roleRoutes = require('./routes/roleRoutes');
//const rolePermissionRoutes = require('./routes/rolePermissionRoutes');
//const permissionRoutes = require('./routes/permissionRoutes');
//const userRoleRoutes = require('./routes/userRoleRoutes');
const mapRoutes = require('./routes/mapRoutes');
const districtPolygonRoutes = require('./routes/districtpolygenRoutes');
const divisionPolygonRoutes = require('./routes/divisionpolygenRoutes');
const assembliesRoutes = require('./routes/assemblypolygenRoutes');
const parliamentPolygonRoutes = require('./routes/parliamentpolygenRoutes');
const stateRoutes = require('./routes/stateRoutes');
const divisionRoutes = require('./routes/divisionRoutes');
const parliamentRoutes = require('./routes/parliamentRoutes');
const districtRoutes = require('./routes/districtRoutes');
const assemblyRoutes = require('./routes/assemblyRoutes');
const statePolygonRoutes = require('./routes/statePolygonRoutes');
const boothRoutes = require('./routes/boothRoutes');
const localDynamicsRoutes = require('./routes/localDynamicsRoutes');
const boothDemographicsRoutes = require('./routes/boothDemographicsRoutes');
const boothElectionStatsRoutes = require('./routes/boothElectionStatsRoutes');
const voteShareRoutes = require('./routes/boothPartyVoteShareRoutes');
const partyPresenceRoutes = require('./routes/boothPartyPresenceRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const boothVolunteersRoutes = require('./routes/boothVolunteersRoutes');
const boothInfrastructureRoutes = require('./routes/boothInfrastructureRoutes');
const votingTrendsRoutes = require('./routes/votingTrendsRoutes');
const boothAdminRoutes = require('./routes/boothAdminRoutes');
const blockRoutes = require('./routes/blockRoutes');
const partyRoutes = require('./routes/partyRoutes');
const yearRoutes = require('./routes/yearRoutes');
const winningPartyRoutes = require('./routes/winningPartyRoutes');
const boothSurveyRoutes = require('./routes/boothSurveyRoutes');
const localNewsRoutes = require('./routes/localNewsRoutes');
const activePartyRoutes = require('./routes/activePartyRoutes');
const accomplishedMLARoutes = require('./routes/accomplishedMLARoutes');
const partyActivityRoutes = require('./routes/partyActivityRoutes');
const userRoutes = require('./routes/userRoutes');
const regionCommitteeRoutes = require('./routes/regionCommitteeRoutes');
const regionInchargeRoutes = require('./routes/regionInchargeRoutes');
const hierarchyRoutes = require('./routes/hierarchyRoutes');
const visitRoutes = require('./routes/visitRoutes');
const boothVotesRoutes = require('./routes/boothVotesRoutes');
const blockVotesRoutes = require('./routes/blockVotesRoutes');
const assemblyVotesRoutes = require('./routes/assemblyVotesRoutes');
const parliamentVotesRoutes = require('./routes/parliamentVotesRoutes');
const electionYearRoutes = require('./routes/electionYearRoutes');
const potentialCandidateRoutes = require('./routes/potentialCandidateRoutes');
const workStatusRoutes = require('./routes/workStatusRoutes');
const casteListRoutes = require('./routes/casteListRoutes');
const localIssueRoutes = require('./routes/localIssueRoutes');
const eventRoutes = require('./routes/eventRoutes');
const eventTypeRoutes = require('./routes/eventTypeRoutes');
const statusRoutes = require('./routes/statusRoutes');
const blockPolygonRoutes = require('./routes/blockPolygonRoutes');
const genderRoutes = require('./routes/genderRoutes');
const electionTypeRoutes = require('./routes/electionTypeRoutes');
const governmentRoutes = require('./routes/governmentRoutes');
const influencerRoutes = require('./routes/influencerRoutes');
// const statePolygonRoutes = require('./routes/statePolygonRoutes');
const codingRoutes = require('./routes/codingRoutes');
const boothPolygonRoutes = require('./routes/boothPolygonsRoutes');
const winningCandidateRoutes = require('./routes/winningCandidateRoutes');
//const indiaPolygonRoutes = require('./routes/indiaPolygonRoutes');
//const voterTurnoutRoutes = require('./routes/voterTurnout');
// const indiaPolygonRoutes from "./routes/indiaPolygonRoutes.js";
const path = require('path');
// const mpPolygonRoutes = require('./routes/statePolygonRoutes');
// Connect to database
connectDB();
const app = express();

// Enable CORS as early as possible
app.use(cors({
  origin: ['http://localhost:3000', 'https://myhostmanager.co.in', 'http://localhost:5173'],
  credentials: true
}));
// Handle preflight requests for all routes
app.options('*', cors({
  origin: ['http://localhost:3000', 'https://myhostmanager.co.in', 'http://localhost:5173'],
  credentials: true
}));

// Body parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Add Cache-Control headers to prevent caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Expires', '0');
  res.set('Pragma', 'no-cache');
  next();
});

// Set security headers with proper configuration for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000"]
    }
  }
}));

// Serve static files from uploads directory

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Body parser with increased limit
app.use(express.json({ limit: '50mb' })); // Add this line
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create an Express Router to handle all API routes
const apiRouter = express.Router();
if (process.env.NODE_ENV === "development") {
  apiRouter.use('/utils', utilsRoutes);
}
// Mount routers on the apiRouter (without /api prefix)
apiRouter.use('/candidates', candidateRoutes); // Enabled for frontend data fetching
apiRouter.use('/auth', authRoutes);
// app.use('/api/roles', roleRoutes);
apiRouter.use('/auth', authRoutes);
// apiRouter.use('/roles', roleRoutes);
// apiRouter.use('/role-permissions', rolePermissionRoutes);
// apiRouter.use('/permissions', permissionRoutes);
// apiRouter.use('/user-roles', userRoleRoutes);
apiRouter.use('/map', mapRoutes);
apiRouter.use('/district-polygons', districtPolygonRoutes);
apiRouter.use('/division-polygons', divisionPolygonRoutes);
apiRouter.use('/assembly-polygons', assembliesRoutes);
apiRouter.use('/local-dynamics', localDynamicsRoutes);
apiRouter.use('/states', stateRoutes);
apiRouter.use('/divisions', divisionRoutes);
apiRouter.use('/parliaments', parliamentRoutes);
apiRouter.use('/parliament-polygons', parliamentPolygonRoutes);
apiRouter.use('/districts', districtRoutes);
apiRouter.use('/assemblies', assemblyRoutes);
apiRouter.use('/booths', boothRoutes);
apiRouter.use('/parties', partyRoutes);
apiRouter.use('/booth-surveys', boothSurveyRoutes);
apiRouter.use('/local-news', localNewsRoutes);
apiRouter.use('/active-parties', activePartyRoutes);
apiRouter.use('/accomplished-mlas', accomplishedMLARoutes);
apiRouter.use('/booth-demographics', boothDemographicsRoutes);
apiRouter.use('/booth-stats', boothElectionStatsRoutes);
apiRouter.use('/vote-shares', voteShareRoutes);
apiRouter.use('/party-presence', partyPresenceRoutes);
apiRouter.use('/blocks', blockRoutes);
apiRouter.use('/years', yearRoutes);
apiRouter.use('/booth-volunteers', boothVolunteersRoutes);
apiRouter.use('/booth-infrastructure', boothInfrastructureRoutes);
apiRouter.use('/voting-trends', votingTrendsRoutes);
apiRouter.use('/booth-admin', boothAdminRoutes);
apiRouter.use('/winning-parties', winningPartyRoutes);
apiRouter.use('/party-activities', partyActivityRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/region-committees', regionCommitteeRoutes);
apiRouter.use('/region-incharges', regionInchargeRoutes);
apiRouter.use('/hierarchy', hierarchyRoutes);
apiRouter.use('/visits', visitRoutes);
apiRouter.use('/booth-votes', boothVotesRoutes);
apiRouter.use('/block-votes', blockVotesRoutes);
apiRouter.use('/assembly-votes', assemblyVotesRoutes);
apiRouter.use('/parliament-votes', parliamentVotesRoutes);
apiRouter.use('/state-polygons', statePolygonRoutes);
apiRouter.use('/election-years', electionYearRoutes);
apiRouter.use('/potential-candidates', potentialCandidateRoutes);
apiRouter.use('/work-status', workStatusRoutes);
apiRouter.use('/caste-lists', casteListRoutes);
apiRouter.use('/local-issues', localIssueRoutes);
apiRouter.use('/events', eventRoutes);
apiRouter.use('/event-types', eventTypeRoutes);
apiRouter.use('/statuses', statusRoutes);
apiRouter.use('/block-polygons', blockPolygonRoutes);
apiRouter.use('/genders', genderRoutes);
apiRouter.use('/election-types', electionTypeRoutes);
apiRouter.use('/governments', governmentRoutes);
apiRouter.use('/influencers', influencerRoutes);
apiRouter.use('/codings', codingRoutes);
apiRouter.use('/booth-polygons', boothPolygonRoutes);
apiRouter.use('/winning-candidates', winningCandidateRoutes);

// Mount the API router on both /api and /backend/api paths
app.use('/api', apiRouter);
app.use('/backend/api', apiRouter);

// Add a simple health check route
app.get('/', (req, res) => {
  res.json({ message: 'ElectionAT Backend is running!', status: 'OK' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'ElectionAT API is running!', status: 'OK' });
});
// app.use('/api/india-polygon', indiaPolygonRoutes);
// app.use('/api/voter-turnout', voterTurnoutRoutes);
// app.use('/api/mp-polygon', mpPolygonRoutes);
// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve static files from the React app build directory
app.use('/election', express.static(path.join(__dirname, 'public')));

// Handle React routing, return all requests to React app
app.get('/election/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use(errorHandler);

app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    // Send first validation error message only
    const firstError = Object.values(err.errors)[0].message;
    return res.status(400).json({ success: false, message: firstError });
  }
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});


module.exports = app;