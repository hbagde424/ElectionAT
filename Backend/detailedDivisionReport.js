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
const generateDetailedReport = async () => {
  try {
    // Connect to database
    await connectDB();

    const db = mongoose.connection.db;
    const divisionId = '695df516378891b2daab05aa';

    console.log(`\n${'='.repeat(60)}`);
    console.log(`DETAILED DIVISION REPORT`);
    console.log(`${'='.repeat(60)}\n`);

    // Query the Division collection
    const division = await db.collection('divisions').findOne({
      _id: new mongoose.Types.ObjectId(divisionId)
    });

    if (division) {
      console.log(`✓ DIVISION FOUND\n`);
      console.log(`Division ID: ${division._id}`);
      console.log(`Division Name: ${division.name || division.divisionName || 'N/A'}`);
      
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`ALL PROPERTIES:`);
      console.log(`${'─'.repeat(60)}\n`);
      
      // Display all properties
      Object.keys(division).forEach(key => {
        const value = division[key];
        if (typeof value === 'object' && value !== null) {
          console.log(`${key}: ${JSON.stringify(value, null, 2)}`);
        } else {
          console.log(`${key}: ${value}`);
        }
      });

      // Extract division name for polygon search
      const divisionName = division.name || division.divisionName;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`POLYGON FEATURE SEARCH`);
      console.log(`${'='.repeat(60)}\n`);

      console.log(`Searching for polygon features matching: "${divisionName}"\n`);

      // Get all documents from Divisionpolygen collection
      const polygonDocs = await db.collection('divisionpolygens').find({}).toArray();
      console.log(`Total Divisionpolygen documents: ${polygonDocs.length}\n`);

      let totalFeatures = 0;
      let matchedFeatures = [];

      // Search through all documents and their features
      for (const doc of polygonDocs) {
        if (doc.features && Array.isArray(doc.features)) {
          totalFeatures += doc.features.length;
          
          for (const feature of doc.features) {
            if (feature.properties) {
              const featureName = feature.properties.Name || feature.properties.Division;
              
              // Check for exact match
              if (featureName && featureName.toLowerCase() === divisionName.toLowerCase()) {
                matchedFeatures.push({
                  documentId: doc._id,
                  featureProperties: feature.properties,
                  hasGeometry: !!feature.geometry,
                  geometryType: feature.geometry?.type || 'N/A'
                });
              }
            }
          }
        }
      }

      console.log(`Total features in Divisionpolygen collection: ${totalFeatures}\n`);

      if (matchedFeatures.length > 0) {
        console.log(`✓ FOUND ${matchedFeatures.length} MATCHING POLYGON FEATURE(S)!\n`);
        matchedFeatures.forEach((match, index) => {
          console.log(`${'─'.repeat(60)}`);
          console.log(`Match ${index + 1}:`);
          console.log(`${'─'.repeat(60)}`);
          console.log(`Document ID: ${match.documentId}`);
          console.log(`Geometry Type: ${match.geometryType}`);
          console.log(`Has Geometry: ${match.hasGeometry}`);
          console.log(`\nFeature Properties:`);
          Object.keys(match.featureProperties).forEach(key => {
            console.log(`  ${key}: ${match.featureProperties[key]}`);
          });
          console.log();
        });
      } else {
        console.log(`✗ NO MATCHING POLYGON FEATURES FOUND\n`);
        console.log(`The division name "${divisionName}" does not match any features in the Divisionpolygen collection.\n`);
        
        // Show sample of available division names
        console.log(`${'─'.repeat(60)}`);
        console.log(`SAMPLE OF AVAILABLE DIVISION NAMES IN DIVISIONPOLYGEN:`);
        console.log(`${'─'.repeat(60)}\n`);
        
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
        
        const namesArray = Array.from(uniqueNames).sort();
        console.log(`Total unique division names: ${namesArray.length}\n`);
        
        if (namesArray.length > 0) {
          console.log(`First 10 division names:`);
          namesArray.slice(0, 10).forEach(name => {
            console.log(`  - ${name}`);
          });
          if (namesArray.length > 10) {
            console.log(`  ... and ${namesArray.length - 10} more`);
          }
        }
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`SUMMARY`);
      console.log(`${'='.repeat(60)}\n`);
      console.log(`Division ID: ${divisionId}`);
      console.log(`Division Name: ${divisionName}`);
      console.log(`Matching Polygon Features: ${matchedFeatures.length}`);
      console.log(`Status: ${matchedFeatures.length > 0 ? '✓ MATCH FOUND' : '✗ NO MATCH FOUND'}`);

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
generateDetailedReport();
