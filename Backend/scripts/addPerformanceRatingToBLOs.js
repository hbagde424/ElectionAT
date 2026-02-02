/**
 * Migration Script: Add performance_rating field to existing BLO records
 * 
 * This script adds the performance_rating field (default: 0) to all existing BLO records
 * that don't have this field yet.
 * 
 * Usage: node Backend/scripts/addPerformanceRatingToBLOs.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const BLA = require('../models/BLA');

const addPerformanceRating = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/electionat';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find all BLAs without performance_rating field
        const blasWithoutRating = await BLA.find({
            $or: [
                { performance_rating: { $exists: false } },
                { performance_rating: null }
            ]
        });

        console.log(`\nFound ${blasWithoutRating.length} BLA records without performance_rating field`);

        if (blasWithoutRating.length === 0) {
            console.log('✅ All BLA records already have performance_rating field');
            process.exit(0);
        }

        // Update records
        console.log('\nUpdating records...');
        let updated = 0;
        let failed = 0;

        for (const bla of blasWithoutRating) {
            try {
                bla.performance_rating = 0;
                await bla.save();
                updated++;
                
                if (updated % 100 === 0) {
                    console.log(`  Processed ${updated}/${blasWithoutRating.length} records...`);
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
        const blasWithRating = await BLA.countDocuments({ 
            performance_rating: { $exists: true, $ne: null } 
        });
        
        console.log(`\nVerification:`);
        console.log(`  Total BLA records: ${totalBLAs}`);
        console.log(`  Records with performance_rating: ${blasWithRating}`);
        console.log(`  Coverage: ${((blasWithRating / totalBLAs) * 100).toFixed(2)}%`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run the migration
console.log('='.repeat(60));
console.log('BLO Performance Rating Migration Script');
console.log('='.repeat(60));
addPerformanceRating();
