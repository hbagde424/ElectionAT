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
const queryBoothPolygon = async () => {
  try {
    // Connect to database
    await connectDB();

    const db = mongoose.connection.db;

    console.log(`\n========================================`);
    console.log(`Querying Booth Polygon Collection`);
    console.log(`========================================\n`);

    // Query one document to see structure
    const boothPolygon = await db.collection('boothpolygons').findOne({});

    if (boothPolygon) {
      console.log(`✓ Booth Polygon Document Found!\n`);
      console.log(`Document ID: ${boothPolygon._id}`);
      console.log(`\nAll Fields and Structure:`);
      console.log(JSON.stringify(boothPolygon, null, 2));

      // Check for booth_id field
      console.log(`\n========================================`);
      console.log(`Field Analysis`);
      console.log(`========================================\n`);
      
      console.log(`booth_id field exists: ${boothPolygon.booth_id ? 'YES' : 'NO'}`);
      if (boothPolygon.booth_id) {
        console.log(`booth_id value: ${boothPolygon.booth_id}`);
        console.log(`booth_id type: ${typeof boothPolygon.booth_id}`);
      }

      console.log(`\nAll top-level fields:`);
      Object.keys(boothPolygon).forEach(key => {
        const value = boothPolygon[key];
        const type = Array.isArray(value) ? 'Array' : typeof value;
        console.log(`  - ${key}: ${type}`);
      });

      // Count total documents
      const totalCount = await db.collection('boothpolygons').countDocuments({});
      console.log(`\n========================================`);
      console.log(`Collection Statistics`);
      console.log(`========================================\n`);
      console.log(`Total booth polygon documents: ${totalCount}`);

      // Check how many have booth_id
      const withBoothId = await db.collection('boothpolygons').countDocuments({ booth_id: { $exists: true, $ne: null } });
      const withoutBoothId = await db.collection('boothpolygons').countDocuments({ booth_id: { $exists: false } });
      const withNullBoothId = await db.collection('boothpolygons').countDocuments({ booth_id: null });

      console.log(`Documents with booth_id (not null): ${withBoothId}`);
      console.log(`Documents without booth_id field: ${withoutBoothId}`);
      console.log(`Documents with booth_id = null: ${withNullBoothId}`);

      // Show sample of documents with booth_id
      if (withBoothId > 0) {
        console.log(`\n========================================`);
        console.log(`Sample Documents WITH booth_id`);
        console.log(`========================================\n`);
        const samplesWithId = await db.collection('boothpolygons')
          .find({ booth_id: { $exists: true, $ne: null } })
          .limit(3)
          .toArray();
        
        samplesWithId.forEach((doc, index) => {
          console.log(`Sample ${index + 1}:`);
          console.log(`  _id: ${doc._id}`);
          console.log(`  booth_id: ${doc.booth_id}`);
          if (doc.properties) {
            console.log(`  BoothName: ${doc.properties.BoothName}`);
            console.log(`  BoothNo: ${doc.properties.BoothNo}`);
          }
          console.log();
        });
      }

      // Show sample of documents without booth_id
      if (withoutBoothId > 0 || withNullBoothId > 0) {
        console.log(`\n========================================`);
        console.log(`Sample Documents WITHOUT booth_id`);
        console.log(`========================================\n`);
        const samplesWithoutId = await db.collection('boothpolygons')
          .find({ $or: [{ booth_id: { $exists: false } }, { booth_id: null }] })
          .limit(3)
          .toArray();
        
        samplesWithoutId.forEach((doc, index) => {
          console.log(`Sample ${index + 1}:`);
          console.log(`  _id: ${doc._id}`);
          console.log(`  booth_id: ${doc.booth_id}`);
          if (doc.properties) {
            console.log(`  BoothName: ${doc.properties.BoothName}`);
            console.log(`  BoothNo: ${doc.properties.BoothNo}`);
          }
          console.log();
        });
      }

    } else {
      console.log(`✗ No booth polygon documents found in collection`);
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
queryBoothPolygon();
