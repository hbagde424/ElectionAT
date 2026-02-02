/**
 * Migration Script: Add new fields to existing BLA records
 * 
 * This script adds the new fields to all existing BLA records:
 * - is_active: Boolean (default: true)
 * - full_address: String (default: empty string)
 * 
 * Usage: node Backend/scripts/addBLAFields.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const BLA = require('../models/BLA');

const addBLAFields = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/electionat';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find all BLAs without the new fields
        const blasWithoutNewFields = await BLA.find({
            $or: [
                { is_active: { $exists: false } },
                { full_address: { $exists: false } }
            ]
        });

        console.log(`\nFound ${blasWithoutNewFields.length} BLA records without new fields`);

        if (blasWithoutNewFields.length === 0) {
            console.log('✅ All BLA records already have the new fields');
            process.exit(0);
        }

        // Update records
        console.log('\nUpdating records...');
        let updated = 0;
        let failed = 0;

        for (const bla of blasWithoutNewFields) {
            try {
                // Add missing fields with default values
                if (bla.is_active === undefined) {
                    bla.is_active = true;
                }
                if (bla.full_address === undefined) {
                    bla.full_address = '';
                }
                
                await bla.save();
                updated++;
                
                if (updated % 50 === 0) {
                    console.log(`  Processed ${updated}/${blasWithoutNewFields.length} records...`);
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
        const blasWithIsActive = await BLA.countDocuments({ 
            is_active: { $exists: true } 
        });
        const blasWithFullAddress = await BLA.countDocuments({ 
            full_address: { $exists: true } 
        });
        
        console.log(`\nVerification:`);
        console.log(`  Total BLA records: ${totalBLAs}`);
        console.log(`  Records with is_active field: ${blasWithIsActive}`);
        console.log(`  Records with full_address field: ${blasWithFullAddress}`);
        console.log(`  is_active coverage: ${((blasWithIsActive / totalBLAs) * 100).toFixed(2)}%`);
        console.log(`  full_address coverage: ${((blasWithFullAddress / totalBLAs) * 100).toFixed(2)}%`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run the migration
console.log('='.repeat(60));
console.log('BLA New Fields Migration Script');
console.log('='.repeat(60));
console.log('Adding fields: is_active (Boolean), full_address (String)');
console.log('='.repeat(60));
addBLAFields();