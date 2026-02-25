const mongoose = require('mongoose');
const User = require('../models/User');
const Assembly = require('../models/Assembly');
require('dotenv').config();

const setupBoothTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/election-atlas');
    console.log('Connected to MongoDB');

    // Find Gandhwani assembly
    const gandhwaniAssembly = await Assembly.findOne({ 
      $or: [
        { name: /gandhwani/i },
        { AC_NAME: /gandhwani/i }
      ]
    });

    if (!gandhwaniAssembly) {
      console.log('Gandhwani assembly not found');
      process.exit(1);
    }

    console.log('Found Gandhwani assembly:', gandhwaniAssembly._id, gandhwaniAssembly.name);

    // Find BOOTHTEST user
    const boothTestUser = await User.findOne({ email: 'boothtest@gmail.com' });

    if (!boothTestUser) {
      console.log('BOOTHTEST user not found');
      process.exit(1);
    }

    console.log('Found BOOTHTEST user:', boothTestUser._id, boothTestUser.email);

    // Update user with assembly_ids
    boothTestUser.assembly_ids = [gandhwaniAssembly._id];
    await boothTestUser.save();

    console.log('Updated BOOTHTEST user with assembly_ids:', boothTestUser.assembly_ids);

    // Also create UserHierarchy record
    const UserHierarchy = require('../models/UserHierarchy');
    
    const hierarchy = await UserHierarchy.findOneAndUpdate(
      { user: boothTestUser._id },
      {
        user: boothTestUser._id,
        assembly: gandhwaniAssembly._id
      },
      { upsert: true, new: true }
    );

    console.log('Created/Updated UserHierarchy:', hierarchy);

    console.log('Setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

setupBoothTestUser();
