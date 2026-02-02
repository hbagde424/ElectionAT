const BLO = require('../models/BLO');
const OtpToken = require('../models/OtpToken');
const { sendSMS } = require('../utils/sms');
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
        
        // Hierarchy filters
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
        const { id } = req.params;
        
        // Find the BLO
        const blo = await BLO.findById(id);
        if (!blo) {
            return res.status(404).json({
                success: false,
                message: 'BLO not found'
            });
        }

        if (!blo.contact_number) {
            return res.status(400).json({
                success: false,
                message: 'No contact number available for this BLO'
            });
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otpCode, 10);

        // Delete any existing OTP tokens for this request
        await OtpToken.deleteMany({
            user_id: req.user.id,
            purpose: 'blo_phone_reveal',
            reference_id: id
        });

        // Create new OTP token
        const otpToken = new OtpToken({
            user_id: req.user.id,
            otp_hash: hashedOtp,
            purpose: 'blo_phone_reveal',
            reference_id: id,
            expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            max_attempts: 5
        });

        await otpToken.save();

        // In development, log OTP to console
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV] BLO Phone Reveal OTP for ${blo.blo_name}: ${otpCode}`);
        }

        // Send SMS (in production, this would go to super admin or configured number)
        const smsMessage = `OTP for revealing BLO phone number: ${otpCode}. Valid for 5 minutes.`;
        const smsDestination = process.env.SUPER_ADMIN_PHONE || process.env.DEFAULT_SMS_NUMBER || '1234567890';
        
        try {
            await sendSMS(smsDestination, smsMessage);
        } catch (smsError) {
            console.error('SMS sending failed:', smsError);
            // Continue anyway - OTP is logged in development
        }

        res.json({
            success: true,
            message: 'OTP sent successfully',
            masked_destination: maskPhoneNumber(smsDestination)
        });

    } catch (error) {
        console.error('Error requesting phone OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Error requesting OTP',
            error: error.message
        });
    }
};

// Verify OTP and reveal phone number
const verifyPhoneOtp = async (req, res) => {
    try {
        const { id } = req.params;
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'OTP is required'
            });
        }

        // Find the OTP token
        const otpToken = await OtpToken.findOne({
            user_id: req.user.id,
            purpose: 'blo_phone_reveal',
            reference_id: id,
            is_used: false,
            expires_at: { $gt: new Date() }
        });

        if (!otpToken) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Check attempt limit
        if (otpToken.attempts >= otpToken.max_attempts) {
            await otpToken.deleteOne();
            return res.status(400).json({
                success: false,
                message: 'Maximum OTP attempts exceeded'
            });
        }

        // Verify OTP
        const isValidOtp = await bcrypt.compare(otp, otpToken.otp_hash);
        
        if (!isValidOtp) {
            otpToken.attempts += 1;
            await otpToken.save();
            
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${otpToken.max_attempts - otpToken.attempts} attempts remaining`
            });
        }

        // Mark OTP as used
        otpToken.is_used = true;
        await otpToken.save();

        // Get the BLO with actual phone number
        const blo = await BLO.findById(id);
        if (!blo) {
            return res.status(404).json({
                success: false,
                message: 'BLO not found'
            });
        }

        // Log activity
        await logActivity(req.user.id, 'VIEW', 'BLO_PHONE', id, `Revealed phone number for BLO: ${blo.blo_name}`);

        res.json({
            success: true,
            message: 'Phone number revealed successfully',
            phone_number: blo.contact_number
        });

    } catch (error) {
        console.error('Error verifying phone OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP',
            error: error.message
        });
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