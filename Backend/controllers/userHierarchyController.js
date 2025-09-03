const UserHierarchy = require('../models/UserHierarchy');

// Set user hierarchy access
exports.setUserHierarchy = async (req, res) => {
    try {
        const { userId, hierarchy } = req.body;

        const userHierarchy = await UserHierarchy.findOneAndUpdate(
            { user: userId },
            {
                user: userId,
                state: hierarchy.state || null,
                division: hierarchy.division || null,
                parliament: hierarchy.parliament || null,
                assembly: hierarchy.assembly || null,
                block: hierarchy.block || null,
                booth: hierarchy.booth || null,
                assignedBy: req.user?._id
            },
            { upsert: true, new: true }
        ).populate(['state', 'division', 'parliament', 'assembly', 'block', 'booth']);

        res.json({
            success: true,
            data: userHierarchy
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Get user hierarchy
exports.getUserHierarchy = async (req, res) => {
    try {
        const { userId } = req.params;
        const userHierarchy = await UserHierarchy.findOne({ user: userId })
            .populate(['state', 'division', 'parliament', 'assembly', 'block', 'booth']);

        res.json({
            success: true,
            data: userHierarchy || {}
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Remove user hierarchy
exports.removeUserHierarchy = async (req, res) => {
    try {
        const { userId } = req.params;
        await UserHierarchy.findOneAndDelete({ user: userId });
        res.json({
            success: true,
            message: 'User hierarchy removed successfully'
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Get all users with their hierarchies
exports.getAllUserHierarchies = async (req, res) => {
    try {
        const userHierarchies = await UserHierarchy.find()
            .populate('user', 'name email username')
            .populate(['state', 'division', 'parliament', 'assembly', 'block', 'booth']);

        res.json({
            success: true,
            data: userHierarchies
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
