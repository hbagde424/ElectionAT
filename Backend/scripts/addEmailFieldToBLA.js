/**
 * Migration Script: Add email field to existing BLA records
 * 
 * This script adds the email field to all existing BLA records:
 * - email: String (default: empty string, not required)
 * 
 * Usage: node Backend/scripts/addEmailFieldToBLA.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const BLA = require('../models/BLA');

const addEmailField = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/electionat';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find all BLAs without the email field
        const blasWithoutEmail = await BLA.find({
            email: { $exists: false }
        });

        console.log(`\nFound ${blasWithoutEmail.length} BLA records without email field`);

        if (blasWithoutEmail.length === 0) {
            console.log('✅ All BLA records already have the email field');
            process.exit(0);
        }

        // Update records
        console.log('\nUpdating records...');
        let updated = 0;
        let failed = 0;

        for (const bla of blasWithoutEmail) {
            try {
                // Add email field with empty string as default
                bla.email = '';
                await bla.save();
                updated++;
                
                if (updated % 50 === 0) {
                    console.log(`  Processed ${updated}/${blasWithoutEmail.length} records...`);
                }
            } catch (err) {
                console.error(`  ❌ Failed to update BLA ${bla._id}:`, err.message);
                failed++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('Migration Complete!');
        console.log('='.repeat(60));
        console.log(`✅ Successfully updated: ${updated} records`);
        if (failed > 0) {
            console.log(`❌ Failed to update: ${failed} records`);
        }
        console.log('='.repeat(60));

        // Verify the update
        const totalBLAs = await BLA.countDocuments();
        const blasWithEmail = await BLA.countDocuments({ 
            email: { $exists: true } 
        });
        
        console.log(`\nVerification:`);
        console.log(`  Total BLA records: ${totalBLAs}`);
        console.log(`  Records with email field: ${blasWithEmail}`);
        console.log(`  Email field coverage: ${((blasWithEmail / totalBLAs) * 100).toFixed(2)}%`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run the migration
console.log('='.repeat(60));
console.log('BLA Email Field Migration Script');
console.log('='.repeat(60));
console.log('Adding field: email (String, optional)');
console.log('='.repeat(60));
addEmailField();