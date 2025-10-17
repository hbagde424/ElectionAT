const Panchayat = require('../models/Panchayat');
const { validationResult } = require('express-validator');

// @desc    Get all panchayats with filters and pagination
// @route   GET /api/panchayats
// @access  Private
const getPanchayats = async (req, res, next) => {
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
        panchayat_name,
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
    if (panchayat_name) filter.panchayat_name = { $regex: panchayat_name, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };

    // Add text search if provided
    if (search) {
        filter.$text = { $search: search };
    }

    try {
        if (all === 'true') {
            // Return all records without pagination for CSV export
            const panchayats = await Panchayat.findWithFullDetails(filter);
            
            res.status(200).json({
                success: true,
                count: panchayats.length,
                data: panchayats
            });
        } else {
            // Paginated response
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;

            const total = await Panchayat.countDocuments(filter);
            const panchayats = await Panchayat.findWithFullDetails(filter)
                .skip(skip)
                .limit(limitNum);

            const pages = Math.ceil(total / limitNum);

            res.status(200).json({
                success: true,
                count: panchayats.length,
                total,
                page: pageNum,
                pages,
                data: panchayats
            });
        }
    } catch (error) {
        console.error('Error fetching panchayats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching panchayats',
            error: error.message
        });
    }
};

// @desc    Get single panchayat by ID
// @route   GET /api/panchayats/:id
// @access  Private
const getPanchayat = async (req, res, next) => {
    try {
        const panchayat = await Panchayat.findById(req.params.id)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('created_by', 'username')
            .populate('updated_by', 'username');

        if (!panchayat) {
            return res.status(404).json({
                success: false,
                message: 'Panchayat not found'
            });
        }

        // Check if user has access to this panchayat based on hierarchy
        if (req.userHierarchy) {
            const hasAccess = (
                (!req.userHierarchy.state || panchayat.state_id._id.toString() === req.userHierarchy.state.toString()) &&
                (!req.userHierarchy.division || panchayat.division_id._id.toString() === req.userHierarchy.division.toString()) &&
                (!req.userHierarchy.parliament || panchayat.parliament_id._id.toString() === req.userHierarchy.parliament.toString()) &&
                (!req.userHierarchy.assembly || panchayat.assembly_id._id.toString() === req.userHierarchy.assembly.toString()) &&
                (!req.userHierarchy.block || panchayat.block_id._id.toString() === req.userHierarchy.block.toString()) &&
                (!req.userHierarchy.booth || panchayat.booth_id._id.toString() === req.userHierarchy.booth.toString())
            );

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Insufficient permissions for this panchayat'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: panchayat
        });
    } catch (error) {
        console.error('Error fetching panchayat:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching panchayat',
            error: error.message
        });
    }
};

// @desc    Create new panchayat
// @route   POST /api/panchayats
// @access  Private
const createPanchayat = async (req, res, next) => {
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

        // Check for duplicate panchayat name in the same booth
        const existingPanchayat = await Panchayat.findOne({
            panchayat_name: req.body.panchayat_name,
            booth_id: req.body.booth_id
        });

        if (existingPanchayat) {
            return res.status(400).json({
                success: false,
                message: 'A panchayat with this name already exists in the selected booth'
            });
        }

        // Create new panchayat
        const panchayatData = {
            ...req.body,
            created_by: req.user.id,
            updated_by: req.user.id
        };

        const panchayat = await Panchayat.create(panchayatData);

        // Fetch the created panchayat with populated fields
        const populatedPanchayat = await Panchayat.findById(panchayat._id)
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
            message: 'Panchayat created successfully',
            data: populatedPanchayat
        });
    } catch (error) {
        console.error('Error creating panchayat:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating panchayat',
            error: error.message
        });
    }
};

// @desc    Update panchayat
// @route   PUT /api/panchayats/:id
// @access  Private
const updatePanchayat = async (req, res, next) => {
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
        let panchayat = await Panchayat.findById(req.params.id);

        if (!panchayat) {
            return res.status(404).json({
                success: false,
                message: 'Panchayat not found'
            });
        }

        // Verify all referenced entities exist if they're being updated
        if (req.body.state_id && req.body.state_id !== panchayat.state_id.toString()) {
            const state = await require('../models/state').findById(req.body.state_id);
            if (!state) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid state ID'
                });
            }
        }

        if (req.body.division_id && req.body.division_id !== panchayat.division_id.toString()) {
            const division = await require('../models/Division').findById(req.body.division_id);
            if (!division) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid division ID'
                });
            }
        }

        if (req.body.parliament_id && req.body.parliament_id !== panchayat.parliament_id.toString()) {
            const parliament = await require('../models/Parliament').findById(req.body.parliament_id);
            if (!parliament) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid parliament ID'
                });
            }
        }

        if (req.body.assembly_id && req.body.assembly_id !== panchayat.assembly_id.toString()) {
            const assembly = await require('../models/Assembly').findById(req.body.assembly_id);
            if (!assembly) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid assembly ID'
                });
            }
        }

        if (req.body.block_id && req.body.block_id !== panchayat.block_id.toString()) {
            const block = await require('../models/block').findById(req.body.block_id);
            if (!block) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid block ID'
                });
            }
        }

        if (req.body.booth_id && req.body.booth_id !== panchayat.booth_id.toString()) {
            const booth = await require('../models/booth').findById(req.body.booth_id);
            if (!booth) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid booth ID'
                });
            }
        }

        // Check for duplicate panchayat name if name or booth is being changed
        if (req.body.panchayat_name || req.body.booth_id) {
            const nameToCheck = req.body.panchayat_name || panchayat.panchayat_name;
            const boothToCheck = req.body.booth_id || panchayat.booth_id;

            const existingPanchayat = await Panchayat.findOne({
                panchayat_name: nameToCheck,
                booth_id: boothToCheck,
                _id: { $ne: req.params.id }
            });

            if (existingPanchayat) {
                return res.status(400).json({
                    success: false,
                    message: 'A panchayat with this name already exists in the selected booth'
                });
            }
        }

        // Update panchayat
        const updateData = {
            ...req.body,
            updated_by: req.user.id
        };

        panchayat = await Panchayat.findByIdAndUpdate(
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
            message: 'Panchayat updated successfully',
            data: panchayat
        });
    } catch (error) {
        console.error('Error updating panchayat:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating panchayat',
            error: error.message
        });
    }
};

// @desc    Delete panchayat
// @route   DELETE /api/panchayats/:id
// @access  Private
const deletePanchayat = async (req, res, next) => {
    try {
        const panchayat = await Panchayat.findById(req.params.id);

        if (!panchayat) {
            return res.status(404).json({
                success: false,
                message: 'Panchayat not found'
            });
        }

        // Check if there are any villages associated with this panchayat
        const Village = require('../models/Village');
        const associatedVillages = await Village.countDocuments({ panchayat_id: req.params.id });

        if (associatedVillages > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete panchayat. It has ${associatedVillages} associated village(s). Please remove or reassign the villages first.`
            });
        }

        await Panchayat.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Panchayat deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting panchayat:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting panchayat',
            error: error.message
        });
    }
};

module.exports = {
    getPanchayats,
    getPanchayat,
    createPanchayat,
    updatePanchayat,
    deletePanchayat
};
