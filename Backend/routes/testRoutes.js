const express = require('express');
const router = express.Router();

// Test endpoint that returns sample data for UserRoleAssigner
router.get('/test-user-role-data', (req, res) => {
    try {
        console.log('Test user-role data endpoint called');

        const sampleUsers = [
            {
                _id: '68b82d2c1724ebd239349bf9',
                username: 'admin',
                email: 'admin@example.com',
                mobile: '1234567890',
                role: 'Admin'
            },
            {
                _id: '68b82d2c1724ebd239349bfa',
                username: 'user1',
                email: 'user1@example.com',
                mobile: '1234567891',
                role: 'User'
            }
        ];

        const sampleRoles = [
            {
                _id: '68b7f8916c05324d1f546996',
                name: 'Admin',
                description: 'Administrator role'
            },
            {
                _id: '68b7f8916c05324d1f546997',
                name: 'User',
                description: 'Regular user role'
            }
        ];

        const sampleUserRoles = [
            {
                _id: '68b80f7554b6f01478e0a477',
                user: {
                    _id: '68b82d2c1724ebd239349bf9',
                    username: 'admin',
                    email: 'admin@example.com'
                },
                role: {
                    _id: '68b7f8916c05324d1f546996',
                    name: 'Admin',
                    description: 'Administrator role'
                }
            }
        ];

        res.json({
            success: true,
            data: {
                users: sampleUsers,
                roles: sampleRoles,
                userRoles: sampleUserRoles
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;
