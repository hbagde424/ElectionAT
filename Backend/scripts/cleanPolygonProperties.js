const mongoose = require('mongoose');
const Booth = require('../models/booth');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanPolygonProperties() {
  try {
    console.log('Connecting to database...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/electionAT';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    // Find all booths with polygons
    const booths = await Booth.find({ polygon: { $exists: true, $ne: null } });
    console.log(`Found ${booths.length} booths with polygons`);

    let updated = 0;
    for (const booth of booths) {
      if (booth.polygon) {
        // Keep only booth_id in properties
        booth.polygon.properties = {
          booth_id: booth._id
        };
        await booth.save();
        updated++;
        console.log(`Updated booth: ${booth.name} (${booth.booth_number})`);
      }
    }

    console.log(`\nSuccessfully cleaned ${updated} booth polygons`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanPolygonProperties();
