const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/db');
const { specs, swaggerUi } = require('./config/swagger');

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

// Body parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://mbnmediaconsulting.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

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
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Add Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Body parser with increased limit
app.use(express.json({ limit: '50mb' })); // Add this line
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Add route debugging middleware
app.use((req, res, next) => {
  console.log(`Route being accessed: ${req.method} ${req.path}`);
  next();
});

// Create an Express Router to handle all API routes with strict routing
const apiRouter = express.Router({
  strict: true,
  caseSensitive: true,
  mergeParams: false
});

// Middleware to sanitize route parameters
const sanitizeParams = (req, res, next) => {
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = req.params[key].replace(/[^\w\-\.\/]/g, '');
      }
    });
  }
  next();
};

// Apply sanitization middleware to all routes
apiRouter.use(sanitizeParams);

// Mount routers on the apiRouter (without /api prefix)
// Add error handling wrapper for routes
const wrapAsync = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const mountRoute = (path, router) => {
  try {
    console.log(`Mounting route: ${path}`);
    // Ensure path starts with a slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Add middleware to log and validate route parameters
    apiRouter.use(normalizedPath, (req, res, next) => {
      console.log(`Accessing ${normalizedPath} with URL: ${req.url}`);
      // Log any route parameters
      if (Object.keys(req.params).length > 0) {
        console.log('Route parameters:', req.params);
      }
      next();
    }, router);

  } catch (err) {
    console.error(`Error mounting route ${path}:`, err);
    throw err;
  }
};

// Mount routes with error handling
mountRoute('/candidates', candidateRoutes);
mountRoute('/auth', authRoutes);
// Commented routes
// mountRoute('/roles', roleRoutes);
// mountRoute('/role-permissions', rolePermissionRoutes);
// mountRoute('/permissions', permissionRoutes);
// mountRoute('/user-roles', userRoleRoutes);
// Mount core routes
mountRoute('/map', mapRoutes);
mountRoute('/district-polygons', districtPolygonRoutes);
mountRoute('/division-polygons', divisionPolygonRoutes);
mountRoute('/assembly-polygons', assembliesRoutes);
mountRoute('/local-dynamics', localDynamicsRoutes);
mountRoute('/states', stateRoutes);
mountRoute('/divisions', divisionRoutes);
mountRoute('/parliaments', parliamentRoutes);
mountRoute('/parliament-polygons', parliamentPolygonRoutes);
mountRoute('/districts', districtRoutes);
mountRoute('/assemblies', assemblyRoutes);
mountRoute('/booths', boothRoutes);
mountRoute('/parties', partyRoutes);
mountRoute('/booth-surveys', boothSurveyRoutes);
mountRoute('/local-news', localNewsRoutes);
mountRoute('/active-parties', activePartyRoutes);
mountRoute('/accomplished-mlas', accomplishedMLARoutes);
// Mount demographic and statistics routes
mountRoute('/booth-demographics', boothDemographicsRoutes);
mountRoute('/booth-stats', boothElectionStatsRoutes);
mountRoute('/vote-shares', voteShareRoutes);
mountRoute('/party-presence', partyPresenceRoutes);
mountRoute('/blocks', blockRoutes);
mountRoute('/years', yearRoutes);
mountRoute('/booth-volunteers', boothVolunteersRoutes);
mountRoute('/booth-infrastructure', boothInfrastructureRoutes);
mountRoute('/voting-trends', votingTrendsRoutes);
mountRoute('/booth-admin', boothAdminRoutes);
mountRoute('/winning-parties', winningPartyRoutes);
mountRoute('/party-activities', partyActivityRoutes);
mountRoute('/users', userRoutes);
mountRoute('/region-committees', regionCommitteeRoutes);
mountRoute('/region-incharges', regionInchargeRoutes);
mountRoute('/hierarchy', hierarchyRoutes);
// Mount remaining routes
mountRoute('/visits', visitRoutes);
mountRoute('/booth-votes', boothVotesRoutes);
mountRoute('/block-votes', blockVotesRoutes);
mountRoute('/assembly-votes', assemblyVotesRoutes);
mountRoute('/parliament-votes', parliamentVotesRoutes);
mountRoute('/state-polygons', statePolygonRoutes);
mountRoute('/election-years', electionYearRoutes);
mountRoute('/potential-candidates', potentialCandidateRoutes);
mountRoute('/work-status', workStatusRoutes);
mountRoute('/caste-lists', casteListRoutes);
mountRoute('/local-issues', localIssueRoutes);
mountRoute('/events', eventRoutes);
mountRoute('/event-types', eventTypeRoutes);
mountRoute('/statuses', statusRoutes);
mountRoute('/block-polygons', blockPolygonRoutes);
mountRoute('/genders', genderRoutes);
mountRoute('/election-types', electionTypeRoutes);
mountRoute('/governments', governmentRoutes);
mountRoute('/influencers', influencerRoutes);
mountRoute('/codings', codingRoutes);
mountRoute('/booth-polygons', boothPolygonRoutes);
mountRoute('/winning-candidates', winningCandidateRoutes);

// Mount the API router
app.use('/api', apiRouter);

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Handle React routing, return all requests to React app
app.get(['/election/*', '/election'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Custom error handler for path-to-regexp errors
app.use((err, req, res, next) => {
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    params: req.params,
    path: req.path
  });

  if (err instanceof TypeError && err.message.includes('Missing parameter name')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid route pattern',
      path: req.path,
      details: 'The request URL contains invalid characters or malformed parameters'
    });
  }
  next(err);
});

// Error handlers
app.use((err, req, res, next) => {
  // Log the error for debugging
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    params: req.params
  });
  next(err);
});

// Handle path-to-regexp errors specifically
app.use((err, req, res, next) => {
  if (err instanceof TypeError && err.message.includes('Missing parameter name')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid route configuration',
      details: err.message,
      path: req.path
    });
  }
  next(err);
});

// Handle validation errors
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const firstError = Object.values(err.errors)[0].message;
    return res.status(400).json({ success: false, message: firstError });
  }
  next(err);
});

// Final error handler
app.use(errorHandler);

// Catch-all error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error',
    path: req.path
  });
});


module.exports = app;