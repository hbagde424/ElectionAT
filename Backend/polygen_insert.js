const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function importRawJSON() {
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('electionAT');
    const collection = db.collection('blockpolygens');
    
    // Drop existing indexes if they exist
    try {
      await collection.dropIndex('BoothName');
      console.log('Dropped existing index');
    } catch (e) {
      console.log('No existing index to drop');
    }
    
    // Use your specific path
    const jsonPath = 'C:/Users/devel/OneDrive/Documents/GitHub/ElectionAT/Backend/Data/Bagh.json';
    
    // Verify the file exists
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found at: ${jsonPath}\nPlease verify the file exists at this location.`);
    }
    
    // Read and parse the JSON file
    console.log(`Reading file from: ${jsonPath}`);
    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
      console.log(`Found ${data.features.length} features to import`);
      
      // Transform features into documents
      const documents = data.features.map((feature, index) => ({
        _id: `${feature.properties.BoothName}_${index}`, // Create unique ID
        ...feature,
        importedAt: new Date(),
        sourceFile: 'Bagh.json'
      }));
      
      // Insert documents
      console.log('Inserting documents...');
      const result = await collection.insertMany(documents, { ordered: false });
      console.log(`Successfully imported ${result.insertedCount} documents`);
      
      // Create index on BoothName
      console.log('Creating index...');
      await collection.createIndex({ "properties.BoothName": 1 });
      console.log('Created index on properties.BoothName');
      
      // Create geospatial index
      await collection.createIndex({ "geometry": "2dsphere" });
      console.log('Created 2dsphere index on geometry');
    } else {
      console.error('Invalid GeoJSON format - expected FeatureCollection with features array');
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (err.writeErrors) {
      console.error('Insert errors:', err.writeErrors.length);
    }
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

importRawJSON().catch(console.error);