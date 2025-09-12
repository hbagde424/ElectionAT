const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');

// @desc    Get menu/dashboard data
// @route   GET /api/menu/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
    try {
        // You can customize this based on your needs
        const dashboardMenu = {
            success: true,
            data: {
                menu: [
                    {
                        id: 'default',
                        title: 'Dashboard',
                        type: 'group',
                        children: [
                            {
                                id: 'default-dashboard',
                                title: 'Dashboard',
                                type: 'item',
                                url: '/dashboard/default',
                                icon: 'dashboard'
                            }
                        ]
                    },
                    {
                        id: 'management',
                        title: 'Management',
                        type: 'group',
                        children: [
                            {
                                id: 'booth',
                                title: 'Booth Management',
                                type: 'collapse',
                                icon: 'location_on',
                                children: [
                                    {
                                        id: 'booth-list',
                                        title: 'Booth List',
                                        type: 'item',
                                        url: '/booth/list'
                                    },
                                    {
                                        id: 'booth-add',
                                        title: 'Add Booth',
                                        type: 'item',
                                        url: '/booth/add'
                                    }
                                ]
                            },
                            {
                                id: 'local-issues',
                                title: 'Local Issues',
                                type: 'collapse',
                                icon: 'report_problem',
                                children: [
                                    {
                                        id: 'issues-list',
                                        title: 'Issues List',
                                        type: 'item',
                                        url: '/issues/list'
                                    },
                                    {
                                        id: 'add-issue',
                                        title: 'Add Issue',
                                        type: 'item',
                                        url: '/issues/add'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        };

        res.status(200).json(dashboardMenu);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
});

module.exports = router;
