const Falliya = require('../models/Falliya');
const { validationResult } = require('express-validator');

// @desc    Get all falliyas with filters and pagination
// @route   GET /api/falliyas
// @access  Private
const getFalliyas = async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        search,
        state_id,
        division_id,
        parliament_id,
        assembly_id,
        block_id,
        booth_id,
        panchayat_id,
        village_id,
        falliya_name,
        location,
        all
    } = req.query;

    // Build filter object
    let filter = {};

    // Apply hierarchy restrictions based on user permissions
    if (req.userHierarchy) {
        const stateIds = req.userHierarchy.state_ids || [];
        const divisionIds = req.userHierarchy.division_ids || [];
        const parliamentIds = req.userHierarchy.parliament_ids || [];
        const assemblyIds = req.userHierarchy.assembly_ids || [];
        const blockIds = req.userHierarchy.block_ids || [];
        const boothIds = req.userHierarchy.booth_ids || [];

        if (stateIds.length > 0) filter.state_id = { $in: stateIds };
        if (divisionIds.length > 0) filter.division_id = { $in: divisionIds };
        if (parliamentIds.length > 0) filter.parliament_id = { $in: parliamentIds };
        if (assemblyIds.length > 0) filter.assembly_id = { $in: assemblyIds };
        if (blockIds.length > 0) filter.block_id = { $in: blockIds };
        if (boothIds.length > 0) filter.booth_id = { $in: boothIds };
    }

    // Apply additional filters from query parameters
    if (state_id) filter.state_id = state_id;
    if (division_id) filter.division_id = division_id;
    if (parliament_id) filter.parliament_id = parliament_id;
    if (assembly_id) filter.assembly_id = assembly_id;
    if (block_id) filter.block_id = block_id;
    if (booth_id) filter.booth_id = booth_id;
    if (panchayat_id) filter.panchayat_id = panchayat_id;
    if (village_id) filter.village_id = village_id;
    if (falliya_name) filter.falliya_name = { $regex: falliya_name, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };

    // Add text search if provided
    if (search) {
        filter.$text = { $search: search };
    }

    try {
        if (all === 'true') {
            // Return all records without pagination for CSV export
            const falliyas = await Falliya.findWithFullDetails(filter);
            
            res.status(200).json({
                success: true,
                count: falliyas.length,
                data: falliyas
            });
        } else {
            // Paginated response
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;

            const total = await Falliya.countDocuments(filter);
            const falliyas = await Falliya.findWithFullDetails(filter)
                .skip(skip)
                .limit(limitNum);

            const pages = Math.ceil(total / limitNum);

            res.status(200).json({
                success: true,
                count: falliyas.length,
                total,
                page: pageNum,
                pages,
                data: falliyas
            });
        }
    } catch (error) {
        console.error('Error fetching falliyas:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching falliyas',
            error: error.message
        });
    }
};

// @desc    Get single falliya by ID
// @route   GET /api/falliyas/:id
// @access  Private
const getFalliya = async (req, res, next) => {
    try {
        const falliya = await Falliya.findById(req.params.id)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('panchayat_id', 'panchayat_name')
            .populate('village_id', 'village_name')
            .populate('created_by', 'username')
            .populate('updated_by', 'username');

        if (!falliya) {
            return res.status(404).json({
                success: false,
                message: 'Falliya not found'
            });
        }

        res.status(200).json({
            success: true,
            data: falliya
        });
    } catch (error) {
        console.error('Error fetching falliya:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching falliya',
            error: error.message
        });
    }
};

// @desc    Create new falliya
// @route   POST /api/falliyas
// @access  Private
const createFalliya = async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        // Verify all referenced entities exist
        const [State, Division, Parliament, Assembly, Block, Booth, Panchayat, Village] = await Promise.all([
            require('../models/state').findById(req.body.state_id),
            require('../models/Division').findById(req.body.division_id),
            require('../models/Parliament').findById(req.body.parliament_id),
            require('../models/Assembly').findById(req.body.assembly_id),
            require('../models/block').findById(req.body.block_id),
            require('../models/booth').findById(req.body.booth_id),
            require('../models/Panchayat').findById(req.body.panchayat_id),
            require('../models/Village').findById(req.body.village_id)
        ]);

        if (!State || !Division || !Parliament || !Assembly || !Block || !Booth || !Panchayat || !Village) {
            return res.status(400).json({
                success: false,
                message: 'One or more referenced entities are invalid'
            });
        }

        // Check for duplicate falliya name in the same village
        const existingFalliya = await Falliya.findOne({
            falliya_name: req.body.falliya_name,
            village_id: req.body.village_id
        });

        if (existingFalliya) {
            return res.status(400).json({
                success: false,
                message: 'A falliya with this name already exists in the selected village'
            });
        }

        // Create new falliya
        const falliyaData = {
            ...req.body,
            created_by: req.user.id,
            updated_by: req.user.id
        };

        const falliya = await Falliya.create(falliyaData);

        // Fetch the created falliya with populated fields
        const populatedFalliya = await Falliya.findById(falliya._id)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('panchayat_id', 'panchayat_name')
            .populate('village_id', 'village_name')
            .populate('created_by', 'username')
            .populate('updated_by', 'username');

        res.status(201).json({
            success: true,
            message: 'Falliya created successfully',
            data: populatedFalliya
        });
    } catch (error) {
        console.error('Error creating falliya:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating falliya',
            error: error.message
        });
    }
};

// @desc    Update falliya
// @route   PUT /api/falliyas/:id
// @access  Private
const updateFalliya = async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        let falliya = await Falliya.findById(req.params.id);

        if (!falliya) {
            return res.status(404).json({
                success: false,
                message: 'Falliya not found'
            });
        }

        // Check for duplicate falliya name if name or village is being changed
        if (req.body.falliya_name || req.body.village_id) {
            const nameToCheck = req.body.falliya_name || falliya.falliya_name;
            const villageToCheck = req.body.village_id || falliya.village_id;

            const existingFalliya = await Falliya.findOne({
                falliya_name: nameToCheck,
                village_id: villageToCheck,
                _id: { $ne: req.params.id }
            });

            if (existingFalliya) {
                return res.status(400).json({
                    success: false,
                    message: 'A falliya with this name already exists in the selected village'
                });
            }
        }

        // Update falliya
        const updateData = {
            ...req.body,
            updated_by: req.user.id
        };

        falliya = await Falliya.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('state_id', 'name')
         .populate('division_id', 'name')
         .populate('parliament_id', 'name')
         .populate('assembly_id', 'name AC_NO')
         .populate('block_id', 'name')
         .populate('booth_id', 'name booth_number')
         .populate('panchayat_id', 'panchayat_name')
         .populate('village_id', 'village_name')
         .populate('created_by', 'username')
         .populate('updated_by', 'username');

        res.status(200).json({
            success: true,
            message: 'Falliya updated successfully',
            data: falliya
        });
    } catch (error) {
        console.error('Error updating falliya:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating falliya',
            error: error.message
        });
    }
};

// @desc    Delete falliya
// @route   DELETE /api/falliyas/:id
// @access  Private
const deleteFalliya = async (req, res, next) => {
    try {
        const falliya = await Falliya.findById(req.params.id);

        if (!falliya) {
            return res.status(404).json({
                success: false,
                message: 'Falliya not found'
            });
        }

        await Falliya.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Falliya deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting falliya:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting falliya',
            error: error.message
        });
    }
};

module.exports = {
    getFalliyas,
    getFalliya,
    createFalliya,
    updateFalliya,
    deleteFalliya
};