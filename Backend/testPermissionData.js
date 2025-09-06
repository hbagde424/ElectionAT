// Simple permission data for testing without database
const testPermissions = [
    'user_create', 'user_read', 'user_update', 'user_delete',
    'user_role_assign', 'user_hierarchy_assign',
    'role_read', 'permission_read',
    'state_read', 'division_read', 'parliament_read', 'assembly_read', 'block_read', 'booth_read',
    'candidate_read', 'party_read', 'voter_read', 'election_data_read',
    'survey_read', 'report_read', 'analytics_read'
];

const testUsers = [
    {
        _id: 'user1',
        email: 'superadmin@example.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'Super Administrator',
        permissions: testPermissions // All permissions
    },
    {
        _id: 'user2',
        email: 'manager@example.com',
        firstName: 'Manager',
        lastName: 'User',
        role: 'Manager',
        permissions: [
            'user_read', 'user_update', 'user_role_assign',
            'role_read', 'permission_read',
            'state_read', 'division_read', 'parliament_read', 'assembly_read', 'block_read', 'booth_read',
            'candidate_read', 'party_read', 'voter_read', 'election_data_read',
            'survey_read', 'report_read', 'analytics_read'
        ]
    },
    {
        _id: 'user3',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 'User',
        permissions: [
            'user_read',
            'state_read', 'division_read', 'parliament_read', 'assembly_read', 'block_read', 'booth_read',
            'candidate_read', 'party_read', 'voter_read', 'election_data_read',
            'survey_read', 'report_read'
        ]
    }
];

console.log('🔧 Test Permission Data Created');
console.log('📊 Available Test Users:');
testUsers.forEach(user => {
    console.log(`  - ${user.email} (${user.role}) - ${user.permissions.length} permissions`);
});

console.log('\n💡 To use this data:');
console.log('1. Login with any of the test emails');
console.log('2. The PermissionContext will simulate their permissions');
console.log('3. Users will appear in the user list');

module.exports = {
    testPermissions,
    testUsers
};
