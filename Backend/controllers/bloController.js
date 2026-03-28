const BLO = require('../models/BLO');
const OtpToken = require('../models/OtpToken');
const { sendSMS, formatOtpMessage } = require('../utils/sms');
const { maskPhoneNumber } = require('../utils/phoneUtils');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../utils/logActivity');

// Get all BLOs with pagination, filtering, and search
const getBLOs = async (req, res) => {
    try {
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
            contact_number,
            election_year_id,
            sort = '-created_at',
            all = false
        } = req.query;

        // Build filter object
        const filter = {};
        
        // Apply hierarchy restrictions based on user permissions
        if (req.userHierarchy) {
            // Get the most specific access level (booth > block > assembly > parliament > division > state)
            const boothIds = req.userHierarchy.booth_ids && req.userHierarchy.booth_ids.length > 0 
                ? req.userHierarchy.booth_ids.map(b => b._id || b) 
                : [];
            const blockIds = req.userHierarchy.block_ids && req.userHierarchy.block_ids.length > 0 
                ? req.userHierarchy.block_ids.map(b => b._id || b) 
                : [];
            const assemblyIds = req.userHierarchy.assembly_ids && req.userHierarchy.assembly_ids.length > 0 
                ? req.userHierarchy.assembly_ids.map(a => a._id || a) 
                : [];
            const parliamentIds = req.userHierarchy.parliament_ids && req.userHierarchy.parliament_ids.length > 0 
                ? req.userHierarchy.parliament_ids.map(p => p._id || p) 
                : [];
            const divisionIds = req.userHierarchy.division_ids && req.userHierarchy.division_ids.length > 0 
                ? req.userHierarchy.division_ids.map(d => d._id || d) 
                : [];
            const stateIds = req.userHierarchy.state_ids && req.userHierarchy.state_ids.length > 0 
                ? req.userHierarchy.state_ids.map(s => s._id || s) 
                : [];

            if (boothIds.length > 0) {
                filter.booth_id = { $in: boothIds };
            } else if (blockIds.length > 0) {
                filter.block_id = { $in: blockIds };
            } else if (assemblyIds.length > 0) {
                filter.assembly_id = { $in: assemblyIds };
            } else if (parliamentIds.length > 0) {
                filter.parliament_id = { $in: parliamentIds };
            } else if (divisionIds.length > 0) {
                filter.division_id = { $in: divisionIds };
            } else if (stateIds.length > 0) {
                filter.state_id = { $in: stateIds };
            }
        }
        
        // Hierarchy filters from query parameters (override hierarchy restrictions if provided)
        if (state_id) filter.state_id = state_id;
        if (division_id) filter.division_id = division_id;
        if (parliament_id) filter.parliament_id = parliament_id;
        if (assembly_id) filter.assembly_id = assembly_id;
        if (block_id) filter.block_id = block_id;
        if (booth_id) filter.booth_id = booth_id;
        if (election_year_id) filter.election_year_id = election_year_id;

        // Text search filters
        if (blo_name) filter.blo_name = { $regex: blo_name, $options: 'i' };
        if (contact_number) filter.contact_number = { $regex: contact_number, $options: 'i' };

        // Global search across multiple fields
        if (search) {
            filter.$or = [
                { blo_name: { $regex: search, $options: 'i' } },
                { contact_number: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } }
            ];
        }

        if (all === 'true') {
            // Return all records without pagination
            const blos = await BLO.findWithFullDetails(filter);
            
            // Mask phone numbers in the response
            const maskedBLOs = blos.map(blo => {
                const bloObj = blo.toObject();
                if (bloObj.contact_number) {
                    bloObj.contact_number = maskPhoneNumber(bloObj.contact_number);
                }
                return bloObj;
            });

            return res.json({
                success: true,
                data: maskedBLOs,
                total: maskedBLOs.length
            });
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get total count
        const total = await BLO.countDocuments(filter);
        const pages = Math.ceil(total / limitNum);

        // Get paginated results
        const blos = await BLO.find(filter)
            .populate('state_id', 'name')
            .populate('division_id', 'name')
            .populate('parliament_id', 'name')
            .populate('assembly_id', 'name AC_NO')
            .populate('block_id', 'name')
            .populate('booth_id', 'name booth_number')
            .populate('election_year_id', 'year')
            .populate('created_by', 'username')
            .populate('updated_by', 'username')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Mask phone numbers in the response
        const maskedBLOs = blos.map(blo => {
            const bloObj = blo.toObject();
            if (bloObj.contact_number) {
                bloObj.contact_number = maskPhoneNumber(bloObj.contact_number);
            }
            return bloObj;
        });

        res.json({
            success: true,
            data: maskedBLOs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages
            },
            total,
            pages
        });

    } catch (error) {
        console.error('Error fetching BLOs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching BLOs',
            error: error.message
        });
    }
};

// Get single BLO by ID
const getBLOById = async (req, res) => {
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
            // Get the most specific access level (booth > block > assembly > parliament > division > state)
            const boothIds = req.userHierarchy.booth_ids && req.userHierarchy.booth_ids.length > 0 
                ? req.userHierarchy.booth_ids.map(b => String(b._id || b)) 
                : [];
            const blockIds = req.userHierarchy.block_ids && req.userHierarchy.block_ids.length > 0 
                ? req.userHierarchy.block_ids.map(b => String(b._id || b)) 
                : [];
            const assemblyIds = req.userHierarchy.assembly_ids && req.userHierarchy.assembly_ids.length > 0 
                ? req.userHierarchy.assembly_ids.map(a => String(a._id || a)) 
                : [];
            const parliamentIds = req.userHierarchy.parliament_ids && req.userHierarchy.parliament_ids.length > 0 
                ? req.userHierarchy.parliament_ids.map(p => String(p._id || p)) 
                : [];
            const divisionIds = req.userHierarchy.division_ids && req.userHierarchy.division_ids.length > 0 
                ? req.userHierarchy.division_ids.map(d => String(d._id || d)) 
                : [];
            const stateIds = req.userHierarchy.state_ids && req.userHierarchy.state_ids.length > 0 
                ? req.userHierarchy.state_ids.map(s => String(s._id || s)) 
                : [];

            // Check if BLO is within user's scope
            let hasAccess = false;
            
            if (boothIds.length > 0) {
                hasAccess = blo.booth_id && boothIds.includes(String(blo.booth_id._id || blo.booth_id));
            } else if (blockIds.length > 0) {
                hasAccess = blo.block_id && blockIds.includes(String(blo.block_id._id || blo.block_id));
            } else if (assemblyIds.length > 0) {
                hasAccess = blo.assembly_id && assemblyIds.includes(String(blo.assembly_id._id || blo.assembly_id));
            } else if (parliamentIds.length > 0) {
                hasAccess = blo.parliament_id && parliamentIds.includes(String(blo.parliament_id._id || blo.parliament_id));
            } else if (divisionIds.length > 0) {
                hasAccess = blo.division_id && divisionIds.includes(String(blo.division_id._id || blo.division_id));
            } else if (stateIds.length > 0) {
                hasAccess = blo.state_id && stateIds.includes(String(blo.state_id._id || blo.state_id));
            }

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Insufficient permissions for this BLO'
                });
            }
        }

        // Mask phone number in the response
        const bloObj = blo.toObject();
        if (bloObj.contact_number) {
            bloObj.contact_number = maskPhoneNumber(bloObj.contact_number);
        }

        res.json({
            success: true,
            data: bloObj
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

// Create new BLO
const createBLO = async (req, res) => {
    try {
        const bloData = {
            ...req.body,
            created_by: req.user.id
        };

        const blo = new BLO(bloData);
        await blo.save();

        // Populate the created BLO
        await blo.populate([
            { path: 'state_id', select: 'name' },
            { path: 'division_id', select: 'name' },
            { path: 'parliament_id', select: 'name' },
            { path: 'assembly_id', select: 'name AC_NO' },
            { path: 'block_id', select: 'name' },
            { path: 'booth_id', select: 'name booth_number' },
            { path: 'election_year_id', select: 'year' },
            { path: 'created_by', select: 'username' }
        ]);

        // Log activity
        await logActivity(req.user.id, 'CREATE', 'BLO', blo._id, `Created BLO: ${blo.blo_name}`);

        // Mask phone number in response
        const bloObj = blo.toObject();
        if (bloObj.contact_number) {
            bloObj.contact_number = maskPhoneNumber(bloObj.contact_number);
        }

        res.status(201).json({
            success: true,
            message: 'BLO created successfully',
            data: bloObj
        });

    } catch (error) {
        console.error('Error creating BLO:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating BLO',
            error: error.message
        });
    }
};

// Update BLO
const updateBLO = async (req, res) => {
    try {
        const updateData = {
            ...req.body,
            updated_by: req.user.id
        };

        const blo = await BLO.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate([
            { path: 'state_id', select: 'name' },
            { path: 'division_id', select: 'name' },
            { path: 'parliament_id', select: 'name' },
            { path: 'assembly_id', select: 'name AC_NO' },
            { path: 'block_id', select: 'name' },
            { path: 'booth_id', select: 'name booth_number' },
            { path: 'election_year_id', select: 'year' },
            { path: 'updated_by', select: 'username' }
        ]);

        if (!blo) {
            return res.status(404).json({
                success: false,
                message: 'BLO not found'
            });
        }

        // Log activity
        await logActivity(req.user.id, 'UPDATE', 'BLO', blo._id, `Updated BLO: ${blo.blo_name}`);

        // Mask phone number in response
        const bloObj = blo.toObject();
        if (bloObj.contact_number) {
            bloObj.contact_number = maskPhoneNumber(bloObj.contact_number);
        }

        res.json({
            success: true,
            message: 'BLO updated successfully',
            data: bloObj
        });

    } catch (error) {
        console.error('Error updating BLO:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating BLO',
            error: error.message
        });
    }
};

// Delete BLO
const deleteBLO = async (req, res) => {
    try {
        const blo = await BLO.findById(req.params.id);
        
        if (!blo) {
            return res.status(404).json({
                success: false,
                message: 'BLO not found'
            });
        }

        await BLO.findByIdAndDelete(req.params.id);

        // Log activity
        await logActivity(req.user.id, 'DELETE', 'BLO', req.params.id, `Deleted BLO: ${blo.blo_name}`);

        res.json({
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

// Request OTP for phone number reveal
const requestPhoneOtp = async (req, res) => {
    try {
        const blo = await BLO.findById(req.params.id);
        if (!blo) {
            return res.status(404).json({ success: false, message: 'BLO not found' });
        }

        // Check if contact number is available
        if (!blo.contact_number) {
            return res.status(400).json({ success: false, message: 'Mobile number not available for this BLO' });
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
            purpose: 'blo_phone_reveal',
            codeHash,
            sentTo: otpMobile,
            createdBy: userId,
            expiresAt,
            meta: {
                bloId: blo._id,
                requestedBy: { id: userId, username: username },
                userAgent: req.headers['user-agent'] || null,
                ip: req.ip || req.headers['x-forwarded-for'] || null
            }
        });

        const msg = formatOtpMessage(otp, OTP_TTL_MINUTES);

        if (process.env.NODE_ENV === 'development') {
            console.log('='.repeat(60));
            console.log('🔐 BLO PHONE REVEAL OTP (Development Mode)');
            console.log('='.repeat(60));
            console.log(`OTP: ${otp}`);
            console.log(`BLO: ${blo.blo_name}`);
            console.log(`Mobile: ${otpMobile}`);
            console.log(`Expires in: ${OTP_TTL_MINUTES} minutes`);
            console.log('='.repeat(60));
        }

        // Try to send SMS, but don't fail if SMS service is down
        try {
            await sendSMS(otpMobile, msg);
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

// Verify OTP and reveal phone number
const verifyPhoneOtp = async (req, res) => {
    try {
        const { requestId, otp } = req.body || {};
        if (!requestId || !otp) {
            return res.status(400).json({ success: false, message: 'requestId and otp are required' });
        }

        const token = await OtpToken.findById(requestId);
        if (!token || token.purpose !== 'blo_phone_reveal') {
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

        // Get the BLO with full phone number
        const bloId = token.meta?.bloId || req.params.id;
        const blo = await BLO.findById(bloId);
        
        if (!blo) {
            return res.status(404).json({ success: false, message: 'BLO not found' });
        }

        return res.json({ 
            success: true, 
            message: 'OTP verified',
            phoneNumber: blo.contact_number || 'N/A'
        });
    } catch (err) {
        console.error('verifyPhoneOtp error:', err);
        return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
};

// Bulk import BLOs
const importBLOs = async (req, res) => {
    try {
        const { data } = req.body;
        
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format. Expected array of BLO records.'
            });
        }

        const results = {
            success: true,
            imported: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < data.length; i++) {
            try {
                const record = data[i];
                
                // Create BLO record
                const bloData = {
                    ...record,
                    created_by: req.user.id
                };

                const blo = new BLO(bloData);
                await blo.save();
                results.imported++;

            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 1,
                    error: error.message
                });
            }
        }

        // Log activity
        await logActivity(req.user.id, 'IMPORT', 'BLO', null, `Imported ${results.imported} BLOs, ${results.failed} failed`);

        res.json({
            ...results,
            message: `Import completed. ${results.imported} records imported, ${results.failed} failed.`
        });

    } catch (error) {
        console.error('Error importing BLOs:', error);
        res.status(500).json({
            success: false,
            message: 'Error importing BLOs',
            error: error.message
        });
    }
};

module.exports = {
    getBLOs,
    getBLOById,
    createBLO,
    updateBLO,
    deleteBLO,
    requestPhoneOtp,
    verifyPhoneOtp,
    importBLOs
};