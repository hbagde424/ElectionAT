const menuController = {
    // Get dashboard menu structure
    getDashboardMenu: async (req, res) => {
        try {
            // Define the basic dashboard menu structure
            const dashboardMenu = {
                id: 'group-dashboard',
                title: 'dashboard',
                type: 'group',
                icon: 'dashboard',
                children: [
                    {
                        id: 'dashboard',
                        title: 'dashboard',
                        type: 'item',
                        url: '/dashboard/default',
                        icon: 'dashboard',
                        breadcrumbs: false
                    }
                ]
            };

            res.json({
                success: true,
                dashboard: dashboardMenu
            });
        } catch (error) {
            console.error('Error fetching dashboard menu:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch dashboard menu'
            });
        }
    }
};

module.exports = menuController;
