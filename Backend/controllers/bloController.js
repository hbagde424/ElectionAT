const BLO = require('../models/BLO');
const { logActivity } = require('../utils/logActivity');
const { validationResult } = require('express-validator');

// @desc    Get all BLOs with filters and pagination
// @route   GET /api/BLOs
// @access  Private
const getBLOs = async (req, res, next) => {
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
        blo_name,
        location,
        all
    } = req.query;

    // Build filter object
    let filter = {};

    // Apply hierarchy restrictions based on user permissions
    if (req.userHierarchy) {
        if (req.userHierarchy.state) filter.state_id = req.userHierarchy.state;
        if (req.userHierarchy.division) filter.division_id = req.userHierarchy.division;
        if (req.userHierarchy.parliament) filter.parliament_id = req.userHierarchy.parliament;
        if (req.userHierarchy.assembly) filter.assembly_id = req.userHierarchy.assembly;
        if (req.userHierarchy.block) filter.block_id = req.userHierarchy.block;
        if (req.userHierarchy.booth) filter.booth_id = req.userHierarchy.booth;
    }

    // Apply additional filters from query parameters
    if (state_id) filter.state_id = state_id;
    if (division_id) filter.division_id = division_id;
    if (parliament_id) filter.parliament_id = parliament_id;
    if (assembly_id) filter.assembly_id = assembly_id;
    if (block_id) filter.block_id = block_id;
    if (booth_id) filter.booth_id = booth_id;
    if (blo_name) filter.blo_name = { $regex: blo_name, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };

    // Add text search if provided
    if (search) {
        filter.$text = { $search: search };
    }

    try {
        if (all === 'true') {
            // Return all records without pagination for CSV export
            const blos = await BLO.findWithFullDetails(filter);
            
            res.status(200).json({
                success: true,
                count: blos.length,
                data: blos
            });
        } else {
            // Paginated response
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;

            const total = await BLO.countDocuments(filter);
            const blos = await BLO.findWithFullDetails(filter)
                .skip(skip)
                .limit(limitNum);

            const pages = Math.ceil(total / limitNum);

            res.status(200).json({
                success: true,
                count: blos.length,
                total,
                page: pageNum,
                pages,
                data: blos
            });
        }
    } catch (error) {
        console.error('Error fetching BLOs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching BLOs',
            error: error.message
        });
    }
};

// @desc    Get single BLO by ID
// @route   GET /api/BLOs/:id
// @access  Private
const getBLO = async (req, res, next) => {
    try {
        // Use a different variable name to avoid shadowing the model
        const blo = await BLO.findById(req.params.id)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('created_by', 'username')
            .populate('updated_by', 'username');

        if (!blo) {
            return res.status(404).json({
                success: false,
                message: 'BLO not found'
            });
        }

        // Check if user has access to this BLO based on hierarchy
        if (req.userHierarchy) {
            const hasAccess = (
                (!req.userHierarchy.state || !blo.state_id || blo.state_id._id.toString() === req.userHierarchy.state.toString()) &&
                (!req.userHierarchy.division || !blo.division_id || blo.division_id._id.toString() === req.userHierarchy.division.toString()) &&
                (!req.userHierarchy.parliament || !blo.parliament_id || blo.parliament_id._id.toString() === req.userHierarchy.parliament.toString()) &&
                (!req.userHierarchy.assembly || !blo.assembly_id || blo.assembly_id._id.toString() === req.userHierarchy.assembly.toString()) &&
                (!req.userHierarchy.block || !blo.block_id || blo.block_id._id.toString() === req.userHierarchy.block.toString()) &&
                (!req.userHierarchy.booth || !blo.booth_id || blo.booth_id._id.toString() === req.userHierarchy.booth.toString())
            );

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Insufficient permissions for this BLO'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: blo
        });
    } catch (error) {
        console.error('Error fetching BLO:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching BLO',
            error: error.message
        });
    }
};

// @desc    Create new BLO
// @route   POST /api/BLOs
// @access  Private
const createBLO = async (req, res, next) => {
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
        const [State, Division, Parliament, Assembly, Block, Booth] = await Promise.all([
            require('../models/state').findById(req.body.state_id),
            require('../models/Division').findById(req.body.division_id),
            require('../models/Parliament').findById(req.body.parliament_id),
            require('../models/Assembly').findById(req.body.assembly_id),
            require('../models/block').findById(req.body.block_id),
            require('../models/booth').findById(req.body.booth_id)
        ]);

        if (!State) {
            return res.status(400).json({
                success: false,
                message: 'Invalid state ID'
            });
        }

        if (!Division) {
            return res.status(400).json({
                success: false,
                message: 'Invalid division ID'
            });
        }

        if (!Parliament) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parliament ID'
            });
        }

        if (!Assembly) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assembly ID'
            });
        }

        if (!Block) {
            return res.status(400).json({
                success: false,
                message: 'Invalid block ID'
            });
        }

        if (!Booth) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booth ID'
            });
        }

        // Check for duplicate BLO name in the same booth
        const existingBLO = await BLO.findOne({
            blo_name: req.body.blo_name,
            booth_id: req.body.booth_id
        });

        if (existingBLO) {
            return res.status(400).json({
                success: false,
                message: 'A BLO with this name already exists in the selected booth'
            });
        }

        // Create new BLO
        const bloData = {
            ...req.body,
            created_by: req.user.id,
            updated_by: req.user.id
        };

        const newBLO = await BLO.create(bloData);

        // Fetch the created BLO with populated fields
        const populatedBLO = await BLO.findById(newBLO._id)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('created_by', 'username')
            .populate('updated_by', 'username');

        res.status(201).json({
            success: true,
            message: 'BLO created successfully',
            data: populatedBLO
        });
    } catch (error) {
        console.error('Error creating BLO:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating BLO',
            error: error.message
        });
    }
};

// @desc    Update BLO
// @route   PUT /api/BLOs/:id
// @access  Private
const updateBLO = async (req, res, next) => {
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
        let existingBLO = await BLO.findById(req.params.id);

        if (!existingBLO) {
            return res.status(404).json({
                success: false,
                message: 'BLO not found'
            });
        }

        // Verify all referenced entities exist if they're being updated
        if (req.body.state_id && req.body.state_id !== existingBLO.state_id.toString()) {
            const state = await require('../models/state').findById(req.body.state_id);
            if (!state) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid state ID'
                });
            }
        }

        if (req.body.division_id && req.body.division_id !== existingBLO.division_id.toString()) {
            const division = await require('../models/Division').findById(req.body.division_id);
            if (!division) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid division ID'
                });
            }
        }

        if (req.body.parliament_id && req.body.parliament_id !== existingBLO.parliament_id.toString()) {
            const parliament = await require('../models/Parliament').findById(req.body.parliament_id);
            if (!parliament) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid parliament ID'
                });
            }
        }

        if (req.body.assembly_id && req.body.assembly_id !== existingBLO.assembly_id.toString()) {
            const assembly = await require('../models/Assembly').findById(req.body.assembly_id);
            if (!assembly) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid assembly ID'
                });
            }
        }

        if (req.body.block_id && req.body.block_id !== existingBLO.block_id.toString()) {
            const block = await require('../models/block').findById(req.body.block_id);
            if (!block) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid block ID'
                });
            }
        }

        if (req.body.booth_id && req.body.booth_id !== existingBLO.booth_id.toString()) {
            const booth = await require('../models/booth').findById(req.body.booth_id);
            if (!booth) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid booth ID'
                });
            }
        }

        // Check for duplicate BLO name if name or booth is being changed
        if (req.body.blo_name || req.body.booth_id) {
            const nameToCheck = req.body.blo_name || existingBLO.blo_name;
            const boothToCheck = req.body.booth_id || existingBLO.booth_id;

            const duplicateBLO = await BLO.findOne({
                blo_name: nameToCheck,
                booth_id: boothToCheck,
                _id: { $ne: req.params.id }
            });

            if (duplicateBLO) {
                return res.status(400).json({
                    success: false,
                    message: 'A BLO with this name already exists in the selected booth'
                });
            }
        }

        // Update BLO
        const updateData = {
            ...req.body,
            updated_by: req.user.id
        };

        const updatedBLO = await BLO.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('state_id', 'name')
         .populate('division_id', 'name')
         .populate('parliament_id', 'name')
         .populate('assembly_id', 'name AC_NO')
         .populate('block_id', 'name')
         .populate('booth_id', 'name booth_number')
         .populate('created_by', 'username')
         .populate('updated_by', 'username');

        res.status(200).json({
            success: true,
            message: 'BLO updated successfully',
            data: updatedBLO
        });
    } catch (error) {
        console.error('Error updating BLO:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating BLO',
            error: error.message
        });
    }
};

// @desc    Delete BLO
// @route   DELETE /api/blos/:id
// @access  Private
const deleteBLO = async (req, res, next) => {
    try {
        const blo = await BLO.findById(req.params.id);

        if (!blo) {
            return res.status(404).json({
                success: false,
                message: 'BLO not found'
            });
        }

        await BLO.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'BLO deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting BLO:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting BLO',
            error: error.message
        });
    }
};

module.exports = {
    getBLOs,
    getBLO,
    createBLO,
    updateBLO,
    deleteBLO
};

