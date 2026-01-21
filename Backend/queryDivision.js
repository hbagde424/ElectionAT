const mongoose = require('mongoose');

// Connect to MongoDB directly
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/electionAT', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`✗ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Main query function
const queryDivision = async () => {
  try {
    // Connect to database
    await connectDB();

    const db = mongoose.connection.db;
    const divisionId = '695df516378891b2daab05aa';

    console.log(`\n========================================`);
    console.log(`Querying Division with ID: ${divisionId}`);
    console.log(`========================================\n`);

    // Query the Division collection
    const division = await db.collection('divisions').findOne({
      _id: new mongoose.Types.ObjectId(divisionId)
    });

    if (division) {
      console.log(`✓ Division Found!\n`);
      console.log(`Division Name: ${division.name || division.divisionName || 'N/A'}`);
      console.log(`\nAll Properties:`);
      console.log(JSON.stringify(division, null, 2));

      // Extract division name for polygon search
      const divisionName = division.name || division.divisionName;

      if (divisionName) {
        console.log(`\n========================================`);
        console.log(`Searching for matching polygon features...`);
        console.log(`========================================\n`);

        // Query Divisionpolygen collection for matching features
        const polygonDocs = await db.collection('divisionpolygens').find({}).toArray();

        let matchedFeatures = [];

        // Search through all documents and their features
        for (const doc of polygonDocs) {
          if (doc.features && Array.isArray(doc.features)) {
            for (const feature of doc.features) {
              if (feature.properties) {
                const featureName = feature.properties.Name || feature.properties.Division;
                if (featureName && featureName.toLowerCase() === divisionName.toLowerCase()) {
                  matchedFeatures.push({
                    documentId: doc._id,
                    featureProperties: feature.properties,
                    hasGeometry: !!feature.geometry
                  });
                }
              }
            }
          }
        }

        if (matchedFeatures.length > 0) {
          console.log(`✓ Found ${matchedFeatures.length} matching polygon feature(s)!\n`);
          matchedFeatures.forEach((match, index) => {
            console.log(`Match ${index + 1}:`);
            console.log(`  Document ID: ${match.documentId}`);
            console.log(`  Feature Properties:`);
            console.log(JSON.stringify(match.featureProperties, null, 4));
            console.log(`  Has Geometry: ${match.hasGeometry}`);
            console.log();
          });
        } else {
          console.log(`✗ No matching polygon features found for division name: "${divisionName}"`);
          
          // Show available division names in Divisionpolygen collection
          console.log(`\nAvailable Division Names in Divisionpolygen collection:`);
          const uniqueNames = new Set();
          for (const doc of polygonDocs) {
            if (doc.features && Array.isArray(doc.features)) {
              for (const feature of doc.features) {
                if (feature.properties && feature.properties.Name) {
                  uniqueNames.add(feature.properties.Name);
                }
              }
            }
          }
          Array.from(uniqueNames).sort().forEach(name => {
            console.log(`  - ${name}`);
          });
        }
      }
    } else {
      console.log(`✗ Division with ID ${divisionId} not found`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed\n');
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the query
queryDivision();
