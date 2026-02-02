const BLA = require('../models/BLA');
const { logActivity } = require('../utils/logActivity');
const { validationResult } = require('express-validator');
const { resolveGeographicHierarchy, validateHierarchy, toKey, toUpper } = require('./importHelpers');
const { maskPhoneNumber } = require('../utils/phoneUtils');
const bcrypt = require('bcryptjs');
const OtpToken = require('../models/OtpToken');
const { sendSms, formatOtpMessage } = require('../utils/sms');

// @desc    Get all BLAs with filters and pagination
// @route   GET /api/blas
// @access  Private
const getBLAs = async (req, res, next) => {
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
        bla_name,
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
    if (bla_name) filter.bla_name = { $regex: bla_name, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (election_year_id) filter.election_year_id = election_year_id;

    // Add text search if provided
    if (search) {
        filter.$text = { $search: search };
    }

    try {
        if (all === 'true') {
            // Return all records without pagination for CSV export
            const blas = await BLA.findWithFullDetails(filter);
            
            // Mask phone numbers in the response
            const maskedBlas = blas.map(bla => {
                const blaObj = bla.toObject();
                if (blaObj.contact_number) {
                    blaObj.contact_number_masked = maskPhoneNumber(blaObj.contact_number);
                    blaObj.contact_number = maskPhoneNumber(blaObj.contact_number);
                }
                return blaObj;
            });
            
            res.status(200).json({
                success: true,
                count: maskedBlas.length,
                data: maskedBlas
            });
        } else {
            // Paginated response
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;

            const total = await BLA.countDocuments(filter);
            const blas = await BLA.findWithFullDetails(filter)
                .skip(skip)
                .limit(limitNum);

            const pages = Math.ceil(total / limitNum);

            // Mask phone numbers in the response
            const maskedBlas = blas.map(bla => {
                const blaObj = bla.toObject();
                if (blaObj.contact_number) {
                    blaObj.contact_number_masked = maskPhoneNumber(blaObj.contact_number);
                    blaObj.contact_number = maskPhoneNumber(blaObj.contact_number);
                }
                return blaObj;
            });

            res.status(200).json({
                success: true,
                count: maskedBlas.length,
                total,
                page: pageNum,
                pages,
                data: maskedBlas
            });
        }
    } catch (error) {
        console.error('Error fetching blas:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching blas',
            error: error.message
        });
    }
};

// @desc    Get single BLA by ID
// @route   GET /api/BLAs/:id
// @access  Private
const getBLA = async (req, res, next) => {
    try {
        const bla = await BLA.findById(req.params.id)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('election_year_id', 'year')
            .populate('created_by', 'username')
            .populate('updated_by', 'username');

        if (!bla) {
            return res.status(404).json({
                success: false,
                message: 'BLA not found'
            });
        }

        // Check if user has access to this BLA based on hierarchy
        if (req.userHierarchy) {
            const hasAccess = (
                (!req.userHierarchy.state || !bla.state_id || bla.state_id._id.toString() === req.userHierarchy.state.toString()) &&
                (!req.userHierarchy.division || !bla.division_id || bla.division_id._id.toString() === req.userHierarchy.division.toString()) &&
                (!req.userHierarchy.parliament || !bla.parliament_id || bla.parliament_id._id.toString() === req.userHierarchy.parliament.toString()) &&
                (!req.userHierarchy.assembly || !bla.assembly_id || bla.assembly_id._id.toString() === req.userHierarchy.assembly.toString()) &&
                (!req.userHierarchy.block || !bla.block_id || bla.block_id._id.toString() === req.userHierarchy.block.toString()) &&
                (!req.userHierarchy.booth || !bla.booth_id || bla.booth_id._id.toString() === req.userHierarchy.booth.toString())
            );

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Insufficient permissions for this BLA'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: bla
        });
    } catch (error) {
        console.error('Error fetching BLA:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching BLA',
            error: error.message
        });
    }
};

// @desc    Create new BLA
// @route   POST /api/blas
// @access  Private
const createBLA = async (req, res, next) => {
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

        const existingBLA = await BLA.findOne({
            bla_name: req.body.bla_name,
            booth_id: req.body.booth_id
        });

        if (existingBLA) {
            return res.status(400).json({
                success: false,
                message: 'A BLA with this name already exists in the selected booth'
            });
        }

        const blaData = {
            ...req.body,
            created_by: req.user.id,
            updated_by: req.user.id
        };

        const newBLA = await BLA.create(blaData);

        const populatedBLA = await BLA.findById(newBLA._id)
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
            message: 'BLA created successfully',
            data: populatedBLA
        });
    } catch (error) {
        console.error('Error creating BLA:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating BLA',
            error: error.message
        });
    }
};

// @desc    Update BLA
// @route   PUT /api/blas/:id
// @access  Private
const updateBLA = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    try {
        let existingBLA = await BLA.findById(req.params.id);

        if (!existingBLA) {
            return res.status(404).json({
                success: false,
                message: 'BLA not found'
            });
        }

        const updateData = {
            ...req.body,
            updated_by: req.user.id
        };

        const updatedBLA = await BLA.findByIdAndUpdate(
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
            message: 'BLA updated successfully',
            data: updatedBLA
        });
    } catch (error) {
        console.error('Error updating BLA:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating BLA',
            error: error.message
        });
    }
};

// @desc    Delete BLA
// @route   DELETE /api/blas/:id
// @access  Private
const deleteBLA = async (req, res, next) => {
    try {
        const bla = await BLA.findById(req.params.id);

        if (!bla) {
            return res.status(404).json({
                success: false,
                message: 'BLA not found'
            });
        }

        await BLA.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'BLA deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting BLA:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting BLA',
            error: error.message
        });
    }
};

// @desc    Import blas from Excel
// @route   POST /api/blas/import
// @access  Private (Admin)
const importBLAs = async (req, res, next) => {
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
                const blaName = toKey(r.bla_name || '');
                const contact = toKey(r.contact_number || '');
                const stateName = toKey(r.state_name || '');
                const divisionCode = toUpper(r.division_code || '');
                const parliamentNo = r.parliament_no;
                const acNo = toKey(r.AC_NO || '');
                const blockName = toKey(r.block_name || '');
                const boothNumber = toKey(r.booth_number || '');
                const electionYearInput = r.election_year_id || r['Election Year ID'] || r.year_id || r.election_year || r['Election Year'] || null;

                if (!blaName) throw new Error('bla_name is required');
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

                // Resolve election year ID for BLA
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

                // Create BLA record
                const blaData = {
                    bla_name: blaName,
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
                    blaData.election_year_id = electionYearId;
                }

                const newBLA = await BLA.create(blaData);
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

// @desc    Request OTP to reveal BLA phone number
// @route   POST /api/blas/:id/request-phone-otp
// @access  Private
const requestPhoneOtp = async (req, res) => {
    try {
        const bla = await BLA.findById(req.params.id);
        if (!bla) {
            return res.status(404).json({ success: false, message: 'BLA not found' });
        }

        // Get OTP destination (super admin or configured number)
        let otpMobile = process.env.CSV_OTP_MOBILE_NUMBER;
        if (!otpMobile) {
            const User = require('../models/User');
            const superAdmin = await User.findOne({ role: 'superAdmin', isActive: true }).sort({ created_at: 1 });
            if (!superAdmin) {
                return res.status(400).json({ success: false, message: 'No active Super Admin found to receive OTP' });
            }
            otpMobile = superAdmin.mobile;
        }

        const OTP_LENGTH = 6;
        const OTP_TTL_MINUTES = 5;
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        
        console.log('Generated Phone Reveal OTP:', otp);
        
        const codeHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

        // Get user ID safely
        const userId = req.user?._id || req.user?.id || 'anonymous';
        const username = req.user?.username || 'unknown';

        const token = await OtpToken.create({
            purpose: 'bla_phone_reveal',
            codeHash,
            sentTo: otpMobile,
            createdBy: userId,
            expiresAt,
            meta: {
                blaId: bla._id,
                requestedBy: { id: userId, username: username },
                userAgent: req.headers['user-agent'] || null,
                ip: req.ip || req.headers['x-forwarded-for'] || null
            }
        });

        const msg = formatOtpMessage(otp, OTP_TTL_MINUTES);

        if (process.env.NODE_ENV === 'development') {
            console.log('='.repeat(60));
            console.log('🔐 BLA PHONE REVEAL OTP (Development Mode)');
            console.log('='.repeat(60));
            console.log(`OTP: ${otp}`);
            console.log(`BLA: ${bla.bla_name}`);
            console.log(`Mobile: ${otpMobile}`);
            console.log(`Expires in: ${OTP_TTL_MINUTES} minutes`);
            console.log('='.repeat(60));
        }

        // Try to send SMS, but don't fail if SMS service is down
        try {
            await sendSms(otpMobile, msg);
        } catch (smsErr) {
            console.warn('SMS sending failed (non-critical):', smsErr.message);
            // Continue anyway - in development mode, OTP is shown in console
        }

        const masked = otpMobile?.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') || '**********';

        const response = {
            success: true,
            requestId: token._id,
            to: masked,
            expiresInMinutes: OTP_TTL_MINUTES
        };

        return res.json(response);
    } catch (err) {
        console.error('requestPhoneOtp error:', err);
        return res.status(500).json({ success: false, message: 'Failed to generate OTP: ' + err.message });
    }
};

// @desc    Verify OTP and reveal BLA phone number
// @route   POST /api/blas/:id/verify-phone-otp
// @access  Private
const verifyPhoneOtp = async (req, res) => {
    try {
        const { requestId, otp } = req.body || {};
        if (!requestId || !otp) {
            return res.status(400).json({ success: false, message: 'requestId and otp are required' });
        }

        const token = await OtpToken.findById(requestId);
        if (!token || token.purpose !== 'bla_phone_reveal') {
            return res.status(400).json({ success: false, message: 'Invalid OTP request' });
        }

        if (token.usedAt) {
            return res.status(400).json({ success: false, message: 'OTP already used' });
        }

        if (new Date() > token.expiresAt) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        if (token.attempts >= 5) {
            return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
        }

        const match = await bcrypt.compare(otp, token.codeHash);
        token.attempts += 1;

        if (!match) {
            await token.save();
            return res.status(400).json({ success: false, message: 'Incorrect OTP' });
        }

        token.usedAt = new Date();
        await token.save();

        // Get the BLA with full phone number
        const blaId = token.meta?.blaId || req.params.id;
        const bla = await BLA.findById(blaId);
        
        if (!bla) {
            return res.status(404).json({ success: false, message: 'BLA not found' });
        }

        return res.json({ 
            success: true, 
            message: 'OTP verified',
            phoneNumber: bla.contact_number || 'N/A'
        });
    } catch (err) {
        console.error('verifyPhoneOtp error:', err);
        return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
};

module.exports = {
    getBLAs,
    getBLA,
    createBLA,
    updateBLA,
    deleteBLA,
    importBLAs,
    requestPhoneOtp,
    verifyPhoneOtp
};
