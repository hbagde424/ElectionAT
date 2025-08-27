// Debug script to find problematic routes
const express = require('express');

// Test mounting routes the same way as in app.js
console.log('Testing route mounting...');

try {
  const app = express();
  const apiRouter = express.Router();
  
  console.log('Loading route files...');
  
  // Load routes one by one to isolate the issue
  const routes = [
    { path: '/auth', file: './routes/authRoutes' },
    { path: '/map', file: './routes/mapRoutes' },
    { path: '/candidates', file: './routes/candidateRoutes' },
    { path: '/district-polygons', file: './routes/districtpolygenRoutes' },
    { path: '/division-polygons', file: './routes/divisionpolygenRoutes' },
    { path: '/assembly-polygons', file: './routes/assemblypolygenRoutes' },
    { path: '/parliament-polygons', file: './routes/parliamentpolygenRoutes' },
    { path: '/states', file: './routes/stateRoutes' },
    { path: '/parties', file: './routes/partyRoutes' },
    { path: '/booths', file: './routes/boothRoutes' }
  ];
  
  routes.forEach(route => {
    try {
      console.log(`Loading ${route.file}...`);
      const routeModule = require(route.file);
      apiRouter.use(route.path, routeModule);
      console.log(`✓ ${route.file} - OK`);
    } catch (error) {
      console.log(`✗ ${route.file} - ERROR:`, error.message);
      console.log(`Error stack:`, error.stack);
    }
  });
  
  // Try mounting the router
  console.log('Mounting API router...');
  app.use('/api', apiRouter);
  console.log('✓ API router mounted successfully');
  
} catch (error) {
  console.log('✗ Error during setup:', error.message);
  console.log('Error stack:', error.stack);
}
