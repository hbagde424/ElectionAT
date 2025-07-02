const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/db');
const { specs, swaggerUi } = require('./config/swagger'); 

// Route files
const authRoutes = require('./routes/authRoutes');
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
const seedSuperAdmin = require('./utils/seedSuperAdmin')
const regionCommitteeRoutes = require('./routes/regionCommitteeRoutes');
const regionInchargeRoutes = require('./routes/regionInchargeRoutes');
const hierarchyRoutes = require('./routes/hierarchyRoutes');
const visitRoutes = require('./routes/visitRoutes');
const boothVotesRoutes = require('./routes/boothVotesRoutes');
const blockVotesRoutes = require('./routes/blockVotesRoutes');
const assemblyVotesRoutes = require('./routes/assemblyVotesRoutes');
const parliamentVotesRoutes = require('./routes/parliamentVotesRoutes');
const ElectionYearRoutes = require('./routes/electionYearRoutes');
const potentialCandidateRoutes = require('./routes/potentialCandidateRoutes');
const workStatusRoutes = require('./routes/workStatusRoutes');
const casteListRoutes = require('./routes/casteListRoutes');
const localIssueRoutes = require('./routes/localIssueRoutes');
const eventRoutes = require('./routes/eventRoutes');
// Connect to database
connectDB();
seedSuperAdmin();
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
app.use('/api/candidates', candidateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/district-polygons', districtPolygonRoutes);
app.use('/api/division-polygons', divisionPolygonRoutes);
app.use('/api/assembly', assembliesRoutes);
app.use('/api/local-dynamics', localDynamicsRoutes);
app.use('/api/states', stateRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/parliaments', parliamentRoutes);
app.use('/api/parliament-polygons', parliamentPolygonRoutes);
app.use('/api/districts', districtRoutes); 
app.use('/api/assemblies', assemblyRoutes);
app.use('/api/booths', boothRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/booth-surveys', boothSurveyRoutes);
app.use('/api/local-news', localNewsRoutes);
app.use('/api/active-parties', activePartyRoutes);
app.use('/api/accomplished-mlas', accomplishedMLARoutes);
app.use('/api/booth-demographics', boothDemographicsRoutes);
app.use('/api/booth-stats', boothElectionStatsRoutes);
app.use('/api/vote-shares', voteShareRoutes);
app.use('/api/party-presence', partyPresenceRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/years', yearRoutes);
app.use('/api/booth-volunteers', boothVolunteersRoutes);
app.use('/api/booth-infrastructure', boothInfrastructureRoutes);
app.use('/api/voting-trends', votingTrendsRoutes);
app.use('/api/booth-admin', boothAdminRoutes);
app.use('/api/winning-parties', winningPartyRoutes);
app.use('/api/party-activities', partyActivityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/region-committees', regionCommitteeRoutes);
app.use('/api/region-incharges', regionInchargeRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/booth-votes', boothVotesRoutes);
app.use('/api/block-votes', blockVotesRoutes);
app.use('/api/assembly-votes', assemblyVotesRoutes);
app.use('/api/parliament-votes', parliamentVotesRoutes);
app.use('/api/election-years', ElectionYearRoutes);
app.use('/api/potential-candidates', potentialCandidateRoutes);
app.use('/api/work-status', workStatusRoutes);
app.use('/api/caste-lists', casteListRoutes);
app.use('/api/local-issues', localIssueRoutes);
app.use('/api/events', eventRoutes);
// Error handler
app.use(errorHandler);

module.exports = app;