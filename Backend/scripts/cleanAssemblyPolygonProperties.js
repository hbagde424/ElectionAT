const mongoose = require('mongoose');
const Assembly = require('../models/Assembly');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanAssemblyPolygonProperties() {
  try {
    console.log('Connecting to database...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/electionAT';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    // Find all assemblies with polygons
    const assemblies = await Assembly.find({ polygon: { $exists: true, $ne: null } });
    console.log(`Found ${assemblies.length} assemblies with polygons`);

    let updated = 0;
    for (const assembly of assemblies) {
      if (assembly.polygon) {
        // Keep only assembly_id in properties
        assembly.polygon.properties = {
          assembly_id: assembly._id
        };
        await assembly.save({ validateBeforeSave: false });
        updated++;
        console.log(`Updated assembly: ${assembly.name} (${assembly.AC_NO})`);
      }
    }

    console.log(`\nSuccessfully cleaned ${updated} assembly polygons`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanAssemblyPolygonProperties();
