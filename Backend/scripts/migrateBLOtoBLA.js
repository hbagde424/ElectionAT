/**
 * Migration Script: Rename BLO collection and fields to BLA
 * 
 * This script:
 * 1. Renames 'blos' collection to 'blas'
 * 2. Updates field name from 'blo_name' to 'bla_name' in all documents
 * 
 * Usage: node Backend/scripts/migrateBLOtoBLA.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const migrateBLOtoBLA = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/electionat';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Check if 'blos' collection exists
        const collections = await db.listCollections({ name: 'blos' }).toArray();
        if (collections.length === 0) {
            console.log('❌ Collection "blos" not found. Migration not needed.');
            process.exit(0);
        }

        console.log('📊 Found "blos" collection. Starting migration...');

        // Get count of documents before migration
        const blosCollection = db.collection('blos');
        const totalDocs = await blosCollection.countDocuments();
        console.log(`📈 Total documents to migrate: ${totalDocs}`);

        if (totalDocs === 0) {
            console.log('⚠️  No documents found in "blos" collection.');
        } else {
            // Step 1: Update field name from 'blo_name' to 'bla_name'
            console.log('\n🔄 Step 1: Updating field names from "blo_name" to "bla_name"...');
            
            const updateResult = await blosCollection.updateMany(
                { blo_name: { $exists: true } },
                { 
                    $rename: { 
                        "blo_name": "bla_name" 
                    } 
                }
            );
            
            console.log(`✅ Updated ${updateResult.modifiedCount} documents with field rename`);
        }

        // Step 2: Rename collection from 'blos' to 'blas'
        console.log('\n🔄 Step 2: Renaming collection from "blos" to "blas"...');
        
        // Check if 'blas' collection already exists
        const blasCollections = await db.listCollections({ name: 'blas' }).toArray();
        if (blasCollections.length > 0) {
            console.log('⚠️  Collection "blas" already exists. Skipping collection rename.');
        } else {
            await blosCollection.rename('blas');
            console.log('✅ Collection renamed from "blos" to "blas"');
        }

        // Step 3: Verify migration
        console.log('\n🔍 Verifying migration...');
        
        const blasCollection = db.collection('blas');
        const finalCount = await blasCollection.countDocuments();
        const blaNameCount = await blasCollection.countDocuments({ bla_name: { $exists: true } });
        const oldBloNameCount = await blasCollection.countDocuments({ blo_name: { $exists: true } });

        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Total documents in "blas" collection: ${finalCount}`);
        console.log(`✅ Documents with "bla_name" field: ${blaNameCount}`);
        console.log(`⚠️  Documents with old "blo_name" field: ${oldBloNameCount}`);
        
        if (oldBloNameCount > 0) {
            console.log('⚠️  Some documents still have "blo_name" field. Manual cleanup may be needed.');
        }

        // Step 4: Update indexes if needed
        console.log('\n🔄 Step 4: Updating indexes...');
        
        try {
            // Drop old index on blo_name if it exists
            await blasCollection.dropIndex('blo_name_1');
            console.log('✅ Dropped old index on "blo_name"');
        } catch (err) {
            console.log('ℹ️  Old index on "blo_name" not found (this is normal)');
        }

        try {
            // Create new index on bla_name
            await blasCollection.createIndex({ bla_name: 1 });
            console.log('✅ Created new index on "bla_name"');
        } catch (err) {
            console.log('ℹ️  Index on "bla_name" may already exist');
        }

        try {
            // Update text index
            await blasCollection.dropIndex('blo_name_text_contact_number_text');
            console.log('✅ Dropped old text index');
        } catch (err) {
            console.log('ℹ️  Old text index not found (this is normal)');
        }

        try {
            // Create new text index
            await blasCollection.createIndex({ 
                bla_name: 'text', 
                contact_number: 'text' 
            });
            console.log('✅ Created new text index on "bla_name" and "contact_number"');
        } catch (err) {
            console.log('ℹ️  Text index may already exist');
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('✅ Collection renamed: "blos" → "blas"');
        console.log('✅ Field renamed: "blo_name" → "bla_name"');
        console.log('✅ Indexes updated');
        console.log('✅ All BLA data is now properly structured');
        console.log('='.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run the migration
console.log('='.repeat(60));
console.log('🚀 BLO to BLA Database Migration Script');
console.log('='.repeat(60));
console.log('⚠️  WARNING: This will modify your database structure!');
console.log('⚠️  Make sure you have a backup before proceeding.');
console.log('='.repeat(60));

// Add a small delay to let user read the warning
setTimeout(() => {
    migrateBLOtoBLA();
}, 2000);