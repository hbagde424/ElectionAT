const Visit = require('../models/Visit');
const Booth = require('../models/booth');
const Block = require('../models/block');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const Division = require('../models/Division');

// @desc    Get all visits
// @route   GET /api/visits
// @access  Public
exports.getVisits = async (req, res, next) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;


        // Basic query
        let query = Visit.find({})
            .populate('booth_id')        // Populate entire booth document
            .populate('block_id')        // Populate entire block document
            .populate('assembly_id')     // Populate entire assembly document
            .populate('parliament_id')   // Populate entire parliament document
            .populate('division_id')     // Populate entire division document
            .sort({ date: -1 });


        // Search functionality
        if (req.query.search) {
            query = query.find({ $text: { $search: req.query.search } });
        }

        // Filter by booth
        if (req.query.booth) {
            query = query.where('booth_id').equals(req.query.booth);
        }

        // Filter by date range
        if (req.query.startDate) {
            const startDate = new Date(req.query.startDate);
            query = query.where('date').gte(startDate);
        }
        if (req.query.endDate) {
            const endDate = new Date(req.query.endDate);
            query = query.where('date').lte(endDate);
        }

        const visits = await query.skip(skip).limit(limit).exec();
        const total = await Visit.countDocuments(query.getFilter());

        res.status(200).json({
            success: true,
            count: visits.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: visits
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single visit
// @route   GET /api/visits/:id
// @access  Public
exports.getVisit = async (req, res, next) => {
    try {
        const visit = await Visit.findById(req.params.id)
            .populate('booth_id', 'booth_number name')
            .populate('block_id', 'name')
            .populate('assembly_id', 'name')
            .populate('parliament_id', 'name')
            .populate('division_id', 'name');

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        res.status(200).json({
            success: true,
            data: visit
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create visit
// @route   POST /api/visits
// @access  Private (Admin only)
exports.createVisit = async (req, res, next) => {
    try {
        // Verify all references exist
        const [
            booth,
            block,
            assembly,
            parliament,
            division
        ] = await Promise.all([
            Booth.findById(req.body.booth_id),
            Block.findById(req.body.block_id),
            Assembly.findById(req.body.assembly_id),
            Parliament.findById(req.body.parliament_id),
            Division.findById(req.body.division_id)
        ]);

        if (!booth || !block || !assembly || !parliament || !division) {
            return res.status(400).json({
                success: false,
                message: 'One or more references not found'
            });
        }

        const visit = await Visit.create(req.body);

        res.status(201).json({
            success: true,
            data: visit
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update visit
// @route   PUT /api/visits/:id
// @access  Private (Admin only)
exports.updateVisit = async (req, res, next) => {
    try {
        let visit = await Visit.findById(req.params.id);

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        // Verify references if being updated
        const references = {};
        if (req.body.booth_id) references.booth = await Booth.findById(req.body.booth_id);
        if (req.body.block_id) references.block = await Block.findById(req.body.block_id);
        if (req.body.assembly_id) references.assembly = await Assembly.findById(req.body.assembly_id);
        if (req.body.parliament_id) references.parliament = await Parliament.findById(req.body.parliament_id);
        if (req.body.division_id) references.division = await Division.findById(req.body.division_id);

        for (const [key, value] of Object.entries(references)) {
            if (!value) {
                return res.status(400).json({
                    success: false,
                    message: `${key} not found`
                });
            }
        }

        visit = await Visit.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
            .populate('booth_id', 'booth_number name')
            .populate('block_id', 'name')
            .populate('assembly_id', 'name')
            .populate('parliament_id', 'name')
            .populate('division_id', 'name');

        res.status(200).json({
            success: true,
            data: visit
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete visit
// @route   DELETE /api/visits/:id
// @access  Private (Admin only)
exports.deleteVisit = async (req, res, next) => {
    try {
        const visit = await Visit.findById(req.params.id);

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        await visit.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get visits by booth
// @route   GET /api/visits/booth/:boothId
// @access  Public
exports.getVisitsByBooth = async (req, res, next) => {
    try {
        const booth = await Booth.findById(req.params.boothId);
        if (!booth) {
            return res.status(404).json({
                success: false,
                message: 'Booth not found'
            });
        }

        const visits = await Visit.find({ booth_id: req.params.boothId })
            .sort({ date: -1 })
            .populate('booth_id', 'booth_number name')
            .populate('block_id', 'name')
            .populate('assembly_id', 'name')
            .populate('parliament_id', 'name')
            .populate('division_id', 'name');

        res.status(200).json({
            success: true,
            count: visits.length,
            data: visits
        });
    } catch (err) {
        next(err);
    }
};