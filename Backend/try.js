const fs = require('fs');
const { MongoClient } = require('mongodb');

async function importRawJSON() {
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('electionAT');
    const collection = db.collection('parliamentpolygens');
    
    // पहले से मौजूद इंडेक्स ड्रॉप करें (यदि कोई error आता है तो ignore करें)
    try {
      await collection.dropIndex('acNo_1');
    } catch (e) {
      console.log('Index not found or already dropped');
    }
    
    const folderPath = 'C:/Users/devel/Downloads/social_media/parliament';
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = `${folderPath}/${file}`;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      try {
        let data = JSON.parse(fileContent);
        
        // यदि डेटा ऐरे नहीं है तो उसे ऐरे में बदलें
        if (!Array.isArray(data)) {
          data = [data];
        }
        
        // सभी डेटा को बिना किसी चेक के इन्सर्ट करें
        await collection.insertMany(data, { ordered: false });
        console.log(`Successfully imported ${file} (${data.length} documents)`);
        
      } catch (err) {
        console.error(`Error importing ${file}:`, err.message);
      }
    }
    
    console.log('All files imported without any validation!');
  } finally {
    await client.close();
  }
}

importRawJSON().catch(console.error);