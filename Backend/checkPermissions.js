const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const UserRole = require('./models/UserRole');
const RolePermission = require('./models/RolePermission');

mongoose.connect('mongodb://localhost:27017/electionat').then(async () => {
    console.log('Connected to MongoDB');

    // Find Super Admin user
    const superAdmin = await User.findOne({ email: 'superadmin@example.com' });
    console.log('Super Admin User:', superAdmin ? { id: superAdmin._id, email: superAdmin.email } : 'Not found');

    if (superAdmin) {
        // Find user roles
        const userRoles = await UserRole.find({ user: superAdmin._id }).populate('role');
        console.log('User Roles:', userRoles.map(ur => ({ role: ur.role.name, roleId: ur.role._id })));

        if (userRoles.length > 0) {
            // Find role permissions for the first role
            const rolePermissions = await RolePermission.find({ role: userRoles[0].role._id }).populate('permission');
            console.log('Role Permissions count:', rolePermissions.length);
            console.log('Permissions:', rolePermissions.map(rp => rp.permission.name).slice(0, 10), '...');
        }
    }

    mongoose.disconnect();
}).catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
});
