// utils/seedSuperAdmin.js
const User = require('../models/User');

const seedSuperAdmin = async () => {
  try {
    const superAdminExists = await User.exists({ role: 'superAdmin' });
    
    if (!superAdminExists) {
      await User.create({
        email: 'superadmin@example.com',
        password: 'superadmin@123',
        role: 'superAdmin',
        accessLevel: 'editor'
      });
      console.log('Initial superAdmin created successfully');
    }
  } catch (err) {
    console.error('Error seeding superAdmin:', err);
  }
};

module.exports = seedSuperAdmin;