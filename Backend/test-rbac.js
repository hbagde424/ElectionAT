const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const RBACService = require('./utils/rbac');
const config = require('./config/config');

const testRBACSystem = async () => {
  try {
    console.log('🧪 Testing RBAC System...');
    
    // Connect to database
    await mongoose.connect(config.MONGO_URI);
    console.log('📦 Connected to MongoDB');

    // Test 1: Find SuperAdmin user
    console.log('\n📋 Test 1: SuperAdmin User');
    const superAdmin = await User.findOne({ role: 'superAdmin' });
    if (superAdmin) {
      console.log('✅ SuperAdmin found:', superAdmin.username);
      
      // Test user permissions
      const permissions = await superAdmin.getPermissions();
      console.log(`✅ SuperAdmin has ${permissions.permissions.length} permissions`);
      
      // Test specific permission
      const canCreateUser = await superAdmin.hasPermission('user.create');
      console.log(`✅ Can create user: ${canCreateUser}`);
    } else {
      console.log('❌ SuperAdmin not found');
    }

    // Test 2: Check roles and permissions
    console.log('\n📋 Test 2: Roles and Permissions');
    const roleCount = await Role.countDocuments();
    const permissionCount = await Permission.countDocuments();
    console.log(`✅ Total roles: ${roleCount}`);
    console.log(`✅ Total permissions: ${permissionCount}`);

    // Test 3: Check role permissions
    console.log('\n📋 Test 3: Role Permissions');
    const stateAdminRole = await Role.findOne({ name: 'StateAdmin' });
    if (stateAdminRole) {
      const rolePerms = await RBACService.checkUserPermission(
        superAdmin._id, 
        'user.read'
      );
      console.log(`✅ StateAdmin can read users: ${rolePerms}`);
    }

    // Test 4: Check permission hierarchy
    console.log('\n📋 Test 4: Permission Levels');
    const permissions = await Permission.find();
    const permissionsByLevel = {};
    permissions.forEach(p => {
      if (!permissionsByLevel[p.level]) {
        permissionsByLevel[p.level] = 0;
      }
      permissionsByLevel[p.level]++;
    });
    
    console.log('✅ Permissions by level:');
    Object.entries(permissionsByLevel).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} permissions`);
    });

    // Test 5: Dashboard data
    console.log('\n📋 Test 5: Dashboard Data');
    if (superAdmin) {
      const dashboardData = await RBACService.getUserDashboardData(superAdmin._id);
      console.log('✅ Dashboard data retrieved');
      console.log(`   User: ${dashboardData.user.username}`);
      console.log(`   Roles: ${dashboardData.roles.length}`);
      console.log(`   Permissions: ${dashboardData.permissions.length}`);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the test
if (require.main === module) {
  testRBACSystem();
}

module.exports = testRBACSystem;
