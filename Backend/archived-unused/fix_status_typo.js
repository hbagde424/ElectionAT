const mongoose = require('mongoose');
const LocalIssue = require('./models/LocalIssue');
require('dotenv').config();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/election_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function fixStatusTypo() {
    try {
        console.log('Starting to fix status typo in LocalIssue collection...');
        
        // Find and update records with the typo
        const result = await LocalIssue.updateMany(
            { status: 'In Progess' }, // Records with typo
            { $set: { status: 'In Progress' } } // Fix the typo
        );
        
        console.log(`Fixed ${result.modifiedCount} records with status typo.`);
        
        // Also check for any other potential issues
        const allStatuses = await LocalIssue.distinct('status');
        console.log('All status values found:', allStatuses);
        
        // Validate all records have valid status
        const validStatuses = ['Reported', 'In Progress', 'Resolved', 'Rejected'];
        const invalidRecords = await LocalIssue.find({
            status: { $nin: validStatuses }
        });
        
        if (invalidRecords.length > 0) {
            console.log(`Found ${invalidRecords.length} records with invalid status values:`);
            invalidRecords.forEach(record => {
                console.log(`ID: ${record._id}, Status: "${record.status}"`);
            });
        } else {
            console.log('All records have valid status values.');
        }
        
    } catch (error) {
        console.error('Error fixing status typo:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

// Run the fix
fixStatusTypo();