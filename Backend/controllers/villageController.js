const Village = require('../models/Village');
const { validationResult } = require('express-validator');

// @desc    Get all villages with filters and pagination
// @route   GET /api/villages
// @access  Private
const getVillages = async (req, res, next) => {
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
        village_name,
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
    if (panchayat_id) filter.panchayat_id = panchayat_id;
    if (village_name) filter.village_name = { $regex: village_name, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };

    // Add text search if provided
    if (search) {
        filter.$text = { $search: search };
    }

    try {
        if (all === 'true') {
            // Return all records without pagination for CSV export
            const villages = await Village.findWithFullDetails(filter);
            
            res.status(200).json({
                success: true,
                count: villages.length,
                data: villages
            });
        } else {
            // Paginated response
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;

            const total = await Village.countDocuments(filter);
            const villages = await Village.findWithFullDetails(filter)
                .skip(skip)
                .limit(limitNum);

            const pages = Math.ceil(total / limitNum);

            res.status(200).json({
                success: true,
                count: villages.length,
                total,
                page: pageNum,
                pages,
                data: villages
            });
        }
    } catch (error) {
        console.error('Error fetching villages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching villages',
            error: error.message
        });
    }
};

// @desc    Get single village by ID
// @route   GET /api/villages/:id
// @access  Private
const getVillage = async (req, res, next) => {
    try {
        const village = await Village.findById(req.params.id)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('panchayat_id', 'panchayat_name')
            .populate('created_by', 'username')
            .populate('updated_by', 'username');

        if (!village) {
            return res.status(404).json({
                success: false,
                message: 'Village not found'
            });
        }

        res.status(200).json({
            success: true,
            data: village
        });
    } catch (error) {
        console.error('Error fetching village:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching village',
            error: error.message
        });
    }
};

// @desc    Create new village
// @route   POST /api/villages
// @access  Private
const createVillage = async (req, res, next) => {
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
        const [State, Division, Parliament, Assembly, Block, Booth, Panchayat] = await Promise.all([
            require('../models/state').findById(req.body.state_id),
            require('../models/Division').findById(req.body.division_id),
            require('../models/Parliament').findById(req.body.parliament_id),
            require('../models/Assembly').findById(req.body.assembly_id),
            require('../models/block').findById(req.body.block_id),
            require('../models/booth').findById(req.body.booth_id),
            require('../models/Panchayat').findById(req.body.panchayat_id)
        ]);

        if (!State || !Division || !Parliament || !Assembly || !Block || !Booth || !Panchayat) {
            return res.status(400).json({
                success: false,
                message: 'One or more referenced entities are invalid'
            });
        }

        // Check for duplicate village name in the same panchayat
        const existingVillage = await Village.findOne({
            village_name: req.body.village_name,
            panchayat_id: req.body.panchayat_id
        });

        if (existingVillage) {
            return res.status(400).json({
                success: false,
                message: 'A village with this name already exists in the selected panchayat'
            });
        }

        // Create new village
        const villageData = {
            ...req.body,
            created_by: req.user.id,
            updated_by: req.user.id
        };

        const village = await Village.create(villageData);

        // Fetch the created village with populated fields
        const populatedVillage = await Village.findById(village._id)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('panchayat_id', 'panchayat_name')
            .populate('created_by', 'username')
            .populate('updated_by', 'username');

        res.status(201).json({
            success: true,
            message: 'Village created successfully',
            data: populatedVillage
        });
    } catch (error) {
        console.error('Error creating village:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating village',
            error: error.message
        });
    }
};

// @desc    Update village
// @route   PUT /api/villages/:id
// @access  Private
const updateVillage = async (req, res, next) => {
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
        let village = await Village.findById(req.params.id);

        if (!village) {
            return res.status(404).json({
                success: false,
                message: 'Village not found'
            });
        }

        // Check for duplicate village name if name or panchayat is being changed
        if (req.body.village_name || req.body.panchayat_id) {
            const nameToCheck = req.body.village_name || village.village_name;
            const panchayatToCheck = req.body.panchayat_id || village.panchayat_id;

            const existingVillage = await Village.findOne({
                village_name: nameToCheck,
                panchayat_id: panchayatToCheck,
                _id: { $ne: req.params.id }
            });

            if (existingVillage) {
                return res.status(400).json({
                    success: false,
                    message: 'A village with this name already exists in the selected panchayat'
                });
            }
        }

        // Update village
        const updateData = {
            ...req.body,
            updated_by: req.user.id
        };

        village = await Village.findByIdAndUpdate(
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
         .populate('created_by', 'username')
         .populate('updated_by', 'username');

        res.status(200).json({
            success: true,
            message: 'Village updated successfully',
            data: village
        });
    } catch (error) {
        console.error('Error updating village:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating village',
            error: error.message
        });
    }
};

// @desc    Delete village
// @route   DELETE /api/villages/:id
// @access  Private
const deleteVillage = async (req, res, next) => {
    try {
        const village = await Village.findById(req.params.id);

        if (!village) {
            return res.status(404).json({
                success: false,
                message: 'Village not found'
            });
        }

        // Check if there are any falliyas associated with this village
        const Falliya = require('../models/Falliya');
        const associatedFalliyas = await Falliya.countDocuments({ village_id: req.params.id });

        if (associatedFalliyas > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete village. It has ${associatedFalliyas} associated falliya(s). Please remove or reassign the falliyas first.`
            });
        }

        await Village.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Village deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting village:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting village',
            error: error.message
        });
    }
};

// @desc    Bulk import villages (client sends parsed rows)
// @route   POST /api/villages/import
// @access  Private (Admin/SuperAdmin)
const importVillages = async (req, res, next) => {
    const { resolveGeographicHierarchy, validateHierarchy, toKey, toNumber } = require('./importHelpers');
    try {
        const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
        if (!rows) return res.status(400).json({ success: false, message: 'rows array is required in body' });

        if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Not authorized' });

        const summary = { total: rows.length, created: 0, skipped: 0, errors: [] };
        const created = [];

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i] || {};
            try {
                const village_name = toKey(r.village_name || r.name || '');
                const location = toKey(r.location || '');
                const male_count = toNumber(r.male_count) ?? 0;
                const female_count = toNumber(r.female_count) ?? 0;
                const others_count = toNumber(r.others_count) ?? 0;
                const total_count = toNumber(r.total_count) ?? (male_count + female_count + others_count);

                if (!village_name) throw new Error('village_name is required');

                const geo = await resolveGeographicHierarchy(r);
                const errors = validateHierarchy(geo, ['state', 'division', 'parliament', 'assembly', 'block', 'booth', 'panchayat']);
                if (errors.length > 0) throw new Error(errors.join(', '));

                const villageData = {
                    village_name,
                    location,
                    state_id: geo.state._id,
                    division_id: geo.division._id,
                    parliament_id: geo.parliament._id,
                    assembly_id: geo.assembly._id,
                    block_id: geo.block._id,
                    booth_id: geo.booth._id,
                    panchayat_id: geo.panchayat._id,
                    male_count,
                    female_count,
                    others_count,
                    total_count,
                    created_by: req.user.id,
                    updated_by: req.user.id
                };

                const v = await Village.create(villageData);
                created.push(v._id);
                summary.created += 1;
            } catch (err) {
                summary.skipped += 1;
                summary.errors.push({ row: i + 1, message: err?.message || String(err), data: rows[i] });
            }
        }

        return res.status(200).json({ success: true, ...summary, ids: created });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getVillages,
    getVillage,
    createVillage,
    updateVillage,
    deleteVillage,
    importVillages
};
