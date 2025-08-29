const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const UserRole = require('./models/UserRole');
const RolePermission = require('./models/RolePermission');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/electionAT');
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Dummy data creation
const seedRBACData = async () => {
  try {
    console.log('🌱 Starting RBAC data seeding...');

    // Clear existing data (optional)
    // await User.deleteMany({});
    // await Role.deleteMany({});
    // await Permission.deleteMany({});
    // await UserRole.deleteMany({});
    // await RolePermission.deleteMany({});

    // 1. Create Permissions
    const permissions = [
      { name: 'user.create', description: 'Create users', module: 'User Management', level: 'State' },
      { name: 'user.read', description: 'View users', module: 'User Management', level: 'Booth' },
      { name: 'user.update', description: 'Update users', module: 'User Management', level: 'State' },
      { name: 'user.delete', description: 'Delete users', module: 'User Management', level: 'State' },
      { name: 'role.create', description: 'Create roles', module: 'Role Management', level: 'State' },
      { name: 'role.read', description: 'View roles', module: 'Role Management', level: 'Booth' },
      { name: 'role.update', description: 'Update roles', module: 'Role Management', level: 'State' },
      { name: 'role.delete', description: 'Delete roles', module: 'Role Management', level: 'State' },
      { name: 'system.admin', description: 'System administration', module: 'System', level: 'State' },
      { name: 'dashboard.view', description: 'View dashboard', module: 'Dashboard', level: 'Booth' },
      { name: 'report.generate', description: 'Generate reports', module: 'Reports', level: 'Division' },
      { name: 'election.manage', description: 'Manage elections', module: 'Elections', level: 'Assembly' }
    ];

    const createdPermissions = [];
    for (const permData of permissions) {
      let permission = await Permission.findOne({ name: permData.name });
      if (!permission) {
        permission = await Permission.create(permData);
        console.log(`✅ Permission created: ${permission.name}`);
      }
      createdPermissions.push(permission);
    }

    // 2. Create Roles
    const roles = [
      { 
        name: 'SuperAdmin', 
        description: 'Complete system access with all permissions',
        level: 0
      },
      { 
        name: 'StateAdmin', 
        description: 'State-level administrative access',
        level: 1
      },
      { 
        name: 'DivisionAdmin', 
        description: 'Division-level administrative access',
        level: 2
      },
      { 
        name: 'AssemblyAdmin', 
        description: 'Assembly-level administrative access',
        level: 3
      },
      { 
        name: 'BlockAdmin', 
        description: 'Block-level administrative access',
        level: 4
      },
      { 
        name: 'BoothAdmin', 
        description: 'Booth-level administrative access',
        level: 5
      },
      { 
        name: 'BoothUser', 
        description: 'Basic booth user with limited access',
        level: 6
      },
      { 
        name: 'Viewer', 
        description: 'Read-only access to system data',
        level: 7
      }
    ];

    const createdRoles = [];
    for (const roleData of roles) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create(roleData);
        console.log(`✅ Role created: ${role.name}`);
      }
      createdRoles.push(role);
    }

    // 3. Assign Permissions to Roles
    const rolePermissionMap = {
      'SuperAdmin': ['user.create', 'user.read', 'user.update', 'user.delete', 'role.create', 'role.read', 'role.update', 'role.delete', 'system.admin', 'dashboard.view', 'report.generate', 'election.manage'],
      'StateAdmin': ['user.read', 'user.update', 'role.read', 'dashboard.view', 'report.generate', 'election.manage'],
      'DivisionAdmin': ['user.read', 'role.read', 'dashboard.view', 'election.manage'],
      'AssemblyAdmin': ['user.read', 'role.read', 'dashboard.view'],
      'BlockAdmin': ['user.read', 'dashboard.view'],
      'BoothAdmin': ['user.read', 'dashboard.view'],
      'BoothUser': ['dashboard.view'],
      'Viewer': ['user.read', 'role.read', 'dashboard.view']
    };

    for (const [roleName, permissionNames] of Object.entries(rolePermissionMap)) {
      const role = createdRoles.find(r => r.name === roleName);
      
      for (const permName of permissionNames) {
        const permission = createdPermissions.find(p => p.name === permName);
        
        if (role && permission) {
          const existingRolePermission = await RolePermission.findOne({
            role: role._id,
            permission: permission._id
          });
          
          if (!existingRolePermission) {
            await RolePermission.create({
              role: role._id,
              permission: permission._id
            });
            console.log(`✅ Assigned ${permName} to ${roleName}`);
          }
        }
      }
    }

    // 4. Create Dummy Users
    const users = [
      {
        username: 'superadmin',
        email: 'admin@electionat.com',
        mobile: '9999999999',
        password: 'admin123',
        role: 'superAdmin',
        isActive: true
      },
      {
        username: 'rajesh_state',
        email: 'rajesh.state@electionat.com',
        mobile: '9876543201',
        password: 'state123',
        role: 'State',
        isActive: true
      },
      {
        username: 'priya_division',
        email: 'priya.division@electionat.com',
        mobile: '9876543202',
        password: 'division123',
        role: 'Division',
        isActive: true
      },
      {
        username: 'amit_assembly',
        email: 'amit.assembly@electionat.com',
        mobile: '9876543203',
        password: 'assembly123',
        role: 'Assembly',
        isActive: true
      },
      {
        username: 'sunita_block',
        email: 'sunita.block@electionat.com',
        mobile: '9876543204',
        password: 'block123',
        role: 'Block',
        isActive: true
      },
      {
        username: 'rahul_booth',
        email: 'rahul.booth@electionat.com',
        mobile: '9876543205',
        password: 'booth123',
        role: 'Booth',
        isActive: true
      },
      {
        username: 'neha_user',
        email: 'neha.user@electionat.com',
        mobile: '9876543206',
        password: 'user123',
        role: 'Booth',
        isActive: true
      },
      {
        username: 'guest_viewer',
        email: 'guest@electionat.com',
        mobile: '9876543207',
        password: 'guest123',
        role: 'Booth',
        isActive: false
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        user = await User.create({
          ...userData,
          password: hashedPassword
        });
        console.log(`✅ User created: ${user.email}`);
      }
      createdUsers.push(user);
    }

    // 5. Assign Roles to Users (using new RBAC system)
    const userRoleAssignments = [
      { email: 'admin@electionat.com', roleName: 'SuperAdmin', scopeType: 'State', scopeId: '507f1f77bcf86cd799439011' },
      { email: 'rajesh.state@electionat.com', roleName: 'StateAdmin', scopeType: 'State', scopeId: '507f1f77bcf86cd799439011' },
      { email: 'priya.division@electionat.com', roleName: 'DivisionAdmin', scopeType: 'Division', scopeId: '507f1f77bcf86cd799439012' },
      { email: 'amit.assembly@electionat.com', roleName: 'AssemblyAdmin', scopeType: 'Assembly', scopeId: '507f1f77bcf86cd799439013' },
      { email: 'sunita.block@electionat.com', roleName: 'BlockAdmin', scopeType: 'Block', scopeId: '507f1f77bcf86cd799439014' },
      { email: 'rahul.booth@electionat.com', roleName: 'BoothAdmin', scopeType: 'Booth', scopeId: '507f1f77bcf86cd799439015' },
      { email: 'neha.user@electionat.com', roleName: 'BoothUser', scopeType: 'Booth', scopeId: '507f1f77bcf86cd799439016' },
      { email: 'guest@electionat.com', roleName: 'Viewer', scopeType: 'State', scopeId: '507f1f77bcf86cd799439011' }
    ];

    for (const assignment of userRoleAssignments) {
      const user = createdUsers.find(u => u.email === assignment.email);
      const role = createdRoles.find(r => r.name === assignment.roleName);
      
      if (user && role) {
        const existingUserRole = await UserRole.findOne({
          user: user._id,
          role: role._id,
          scope_type: assignment.scopeType
        });
        
        if (!existingUserRole) {
          await UserRole.create({
            user: user._id,
            role: role._id,
            scope_type: assignment.scopeType,
            scope_id: new mongoose.Types.ObjectId(assignment.scopeId),
            assigned_by: user._id, // Self-assigned for demo
            assigned_at: new Date()
          });
          console.log(`✅ Assigned ${assignment.roleName} to ${assignment.email}`);
        }
      }
    }

    console.log('\n🎉 RBAC Data Seeding Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Permissions: ${createdPermissions.length}`);
    console.log(`   - Roles: ${createdRoles.length}`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Role-Permission Assignments: ${Object.keys(rolePermissionMap).length}`);
    
    console.log('\n🔐 Test Credentials:');
    console.log('   SuperAdmin: admin@electionat.com / admin123');
    console.log('   StateAdmin: rajesh.state@electionat.com / state123');
    console.log('   AssemblyAdmin: amit.assembly@electionat.com / assembly123');
    console.log('   BoothUser: neha.user@electionat.com / user123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await seedRBACData();
  await mongoose.disconnect();
  console.log('📦 Disconnected from MongoDB');
  process.exit(0);
};

main().catch(console.error);
