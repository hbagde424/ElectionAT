const BLO = require('../models/BLO');
const { logActivity } = require('../utils/logActivity');
const { validationResult } = require('express-validator');
const { resolveGeographicHierarchy, validateHierarchy, toKey, toUpper } = require('./importHelpers');

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
        election_year_id,
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
    if (election_year_id) filter.election_year_id = election_year_id;

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
        const blo = await BLO.findById(req.params.id)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('election_year_id', 'year')
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        const [State, Division, Parliament, Assembly, Block, Booth] = await Promise.all([
            require('../models/state').findById(req.body.state_id),
            require('../models/Division').findById(req.body.division_id),
            require('../models/Parliament').findById(req.body.parliament_id),
            require('../models/Assembly').findById(req.body.assembly_id),
            require('../models/block').findById(req.body.block_id),
            require('../models/booth').findById(req.body.booth_id)
        ]);

        if (!State || !Division || !Parliament || !Assembly || !Block || !Booth) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hierarchy reference'
            });
        }

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

        const bloData = {
            ...req.body,
            created_by: req.user.id,
            updated_by: req.user.id
        };

        const newBLO = await BLO.create(bloData);

        const populatedBLO = await BLO.findById(newBLO._id)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('election_year_id', 'year')
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
         .populate('election_year_id', 'year')
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

// @desc    Import BLOs from Excel
// @route   POST /api/blos/import
// @access  Private (Admin)
const importBLOs = async (req, res, next) => {
    try {
        const rows = Array.isArray(req.body?.rows) ? req.body.rows : (Array.isArray(req.body?.data) ? req.body.data : null);
        if (!rows) {
            return res.status(400).json({ success: false, message: 'rows or data array is required in body' });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const Booth = require('../models/booth');
        const State = require('../models/state');
        const Division = require('../models/Division');
        const Parliament = require('../models/Parliament');
        const Assembly = require('../models/Assembly');
        const Block = require('../models/block');
        const ElectionYear = require('../models/electionYear');

        const summary = { total: rows.length, imported: 0, skipped: 0, errors: [] };
        
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i] || {};
            try {
                // Extract data from Excel columns
                const bloName = toKey(r.blo_name || '');
                const contact = toKey(r.contact_number || '');
                const stateName = toKey(r.state_name || '');
                const divisionCode = toUpper(r.division_code || '');
                const parliamentNo = r.parliament_no;
                const acNo = toKey(r.AC_NO || '');
                const blockName = toKey(r.block_name || '');
                const boothNumber = toKey(r.booth_number || '');
                const electionYearInput = r.election_year_id || r['Election Year ID'] || r.year_id || r.election_year || r['Election Year'] || null;

                if (!bloName) throw new Error('blo_name is required');
                if (!boothNumber) throw new Error('booth_number is required');

                // Find State by name
                let state = await State.findOne({ name: { $regex: `^${stateName}`, $options: 'i' } });
                if (!state) throw new Error(`State not found: ${stateName}`);

                // Find Division by code
                let division = await Division.findOne({ 
                    division_code: { $regex: `^${divisionCode}`, $options: 'i' },
                    state_id: state._id 
                });
                if (!division) throw new Error(`Division not found: ${divisionCode}`);

                // Find Parliament by number
                let parliament = await Parliament.findOne({ 
                    parliament_no: Number(parliamentNo),
                    division_id: division._id 
                });
                if (!parliament) throw new Error(`Parliament not found: ${parliamentNo}`);

                // Find Assembly by AC_NO
                let assembly = await Assembly.findOne({ 
                    AC_NO: acNo,
                    parliament_id: parliament._id 
                });
                if (!assembly) throw new Error(`Assembly not found: ${acNo}`);

                // Find Block by name
                let block = await Block.findOne({ 
                    name: { $regex: `^${blockName}`, $options: 'i' },
                    assembly_id: assembly._id 
                });
                if (!block) throw new Error(`Block not found: ${blockName}`);

                // Find or create booth
                let booth = await Booth.findOne({ 
                    booth_number: boothNumber, 
                    block_id: block._id 
                });

                // Try numeric match if string match failed
                if (!booth && !isNaN(Number(boothNumber))) {
                    booth = await Booth.findOne({ 
                        booth_number: Number(boothNumber), 
                        block_id: block._id 
                    });
                }

                // If booth doesn't exist, create it
                if (!booth) {
                    let electionYear = null;

                    // Get election year for booth creation
                    if (electionYearInput) {
                        if (String(electionYearInput).match(/^[0-9a-fA-F]{24}$/)) {
                            electionYear = await ElectionYear.findById(electionYearInput);
                        }
                        if (!electionYear) {
                            electionYear = await ElectionYear.findOne({ year: electionYearInput });
                        }
                    }

                    // If no election year provided, get the latest one
                    if (!electionYear) {
                        electionYear = await ElectionYear.findOne().sort({ year: -1 });
                    }

                    if (!electionYear) {
                        throw new Error('No election year found to create booth');
                    }

                    // Create new booth
                    booth = await Booth.create({
                        name: `Booth ${boothNumber}`,
                        booth_number: boothNumber,
                        full_address: `${block.name}, ${assembly.name}`,
                        block_id: block._id,
                        assembly_id: assembly._id,
                        parliament_id: parliament._id,
                        division_id: division._id,
                        state_id: state._id,
                        election_year: electionYear._id,
                        created_by: req.user.id,
                        updated_by: req.user.id
                    });
                }

                // Resolve election year ID for BLO
                let electionYearId = null;
                if (electionYearInput) {
                    let electionYear = null;

                    if (String(electionYearInput).match(/^[0-9a-fA-F]{24}$/)) {
                        electionYear = await ElectionYear.findById(electionYearInput);
                    }

                    if (!electionYear) {
                        electionYear = await ElectionYear.findOne({ year: electionYearInput });
                    }

                    if (!electionYear) {
                        throw new Error(`Election year not found: ${electionYearInput}`);
                    }

                    electionYearId = electionYear._id;
                }

                // Create BLO record
                const bloData = {
                    blo_name: bloName,
                    contact_number: contact,
                    state_id: state._id,
                    division_id: division._id,
                    parliament_id: parliament._id,
                    assembly_id: assembly._id,
                    block_id: block._id,
                    booth_id: booth._id,
                    created_by: req.user.id,
                    updated_by: req.user.id
                };

                if (electionYearId) {
                    bloData.election_year_id = electionYearId;
                }

                const newBLO = await BLO.create(bloData);
                summary.imported += 1;
            } catch (err) {
                summary.skipped += 1;
                summary.errors.push({ row: i + 1, message: err?.message || String(err) });
            }
        }

        return res.status(200).json({ success: true, ...summary });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getBLOs,
    getBLO,
    createBLO,
    updateBLO,
    deleteBLO,
    importBLOs
};
