const { MongoClient } = require('mongodb');

async function dropSelectedCollections() {
  const client = new MongoClient('mongodb://localhost:27017');

  try {
    await client.connect();
    const db = client.db('electionAT');

    // जिन collections को बचाना है
    const keepCollections = ['assemblies', 'divisions', 'districts', 'parliaments', 'users'];

    const collections = await db.listCollections().toArray();

    for (const coll of collections) {
      if (!keepCollections.includes(coll.name)) {
        try {
          await db.collection(coll.name).drop();
          console.log(`❌ Dropped collection: ${coll.name}`);
        } catch (err) {
          console.error(`Failed to drop collection ${coll.name}:`, err.message);
        }
      } else {
        console.log(`✅ Kept collection: ${coll.name}`);
      }
    }

    console.log('🎯 Finished dropping unwanted collections.');
  } finally {
    await client.close();
  }
}

dropSelectedCollections().catch(console.error);
