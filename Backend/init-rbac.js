const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const RolePermission = require('./models/RolePermission');
const UserRole = require('./models/UserRole');
const RBACService = require('./utils/rbac');
const bcrypt = require('bcryptjs');
const config = require('./config/config');

const initializeRBACSystem = async () => {
  try {
    console.log('🚀 Initializing RBAC System...');
    
    // Connect to database
    const mongoUri = 'mongodb://localhost:27017/electionAT';
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Initialize default data
    await RBACService.initializeDefaultData();
    console.log('✅ Default roles and permissions created');

    // Setup default role permissions
    await RBACService.setupDefaultRolePermissions();
    console.log('✅ Default role permissions assigned');

    // Create SuperAdmin user if not exists
    const superAdminExists = await User.findOne({ role: 'superAdmin' });
    
    if (!superAdminExists) {
      console.log('🔑 Creating SuperAdmin user...');
      
      // Create SuperAdmin user
      const superAdminData = {
        username: 'superadmin',
        mobile: '9999999999',
        email: 'admin@electionat.com',
        password: 'admin123', // Change this in production
        role: 'superAdmin',
        isActive: true
      };

      const superAdmin = await User.create(superAdminData);
      console.log('✅ SuperAdmin user created:', {
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role
      });

      // Assign SuperAdmin role to the user
      const superAdminRole = await Role.findOne({ name: 'SuperAdmin' });
      if (superAdminRole) {
        await UserRole.create({
          user: superAdmin._id,
          role: superAdminRole._id,
          scope_type: 'State',
          scope_id: new mongoose.Types.ObjectId() // Dummy scope for SuperAdmin
        });
        console.log('✅ SuperAdmin role assigned to user');
      }
    } else {
      console.log('ℹ️  SuperAdmin user already exists');
    }

    console.log('🎉 RBAC System initialization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Roles created: SuperAdmin, StateAdmin, DivisionAdmin, ParliamentAdmin, AssemblyAdmin, BlockAdmin, BoothAdmin, BoothUser');
    console.log('   - Permissions created: Various CRUD operations for different levels');
    console.log('   - Role permissions assigned based on hierarchy');
    console.log('   - SuperAdmin user ready to use');
    console.log('\n🔐 Default SuperAdmin Credentials:');
    console.log('   Email: admin@electionat.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  PLEASE CHANGE THE PASSWORD AFTER FIRST LOGIN!');

  } catch (error) {
    console.error('❌ Error initializing RBAC system:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the initialization
if (require.main === module) {
  initializeRBACSystem();
}

module.exports = initializeRBACSystem;
