const bcrypt = require('bcryptjs');
const OtpToken = require('../models/OtpToken');
const User = require('../models/User');
const { sendSms } = require('../utils/sms');

const OTP_TTL_MINUTES = parseInt(process.env.CSV_EXPORT_OTP_TTL_MINUTES || '5', 10);
const OTP_LENGTH = parseInt(process.env.CSV_EXPORT_OTP_LENGTH || '6', 10);

function generateOtp(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

exports.requestCsvOtp = async (req, res) => {
  try {
    // Find an active super admin to send OTP to
    const superAdmin = await User.findOne({ role: 'superAdmin', isActive: true }).sort({ created_at: 1 });
    if (!superAdmin) {
      return res.status(400).json({ success: false, message: 'No active Super Admin found to receive OTP' });
    }

    const otp = generateOtp(OTP_LENGTH);
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const token = await OtpToken.create({
      purpose: 'csv_export',
      codeHash,
      sentTo: superAdmin.mobile,
      createdBy: req.user._id,
      expiresAt,
      meta: {
        requestedBy: { id: req.user._id, username: req.user.username, email: req.user.email },
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null
      }
    });

    const appName = process.env.APP_NAME || 'ElectionAT';
    const msg = `Your ${appName} CSV download OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`;

    await sendSms(superAdmin.mobile, msg);

    // Mask the mobile for frontend display
    const masked = superAdmin.mobile?.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') || '**********';

    return res.json({ success: true, requestId: token._id, to: masked, expiresInMinutes: OTP_TTL_MINUTES });
  } catch (err) {
    console.error('requestCsvOtp error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate OTP' });
  }
};

exports.verifyCsvOtp = async (req, res) => {
  try {
    const { requestId, otp } = req.body || {};
    if (!requestId || !otp) {
      return res.status(400).json({ success: false, message: 'requestId and otp are required' });
    }

    const token = await OtpToken.findById(requestId);
    if (!token || token.purpose !== 'csv_export') {
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

    return res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error('verifyCsvOtp error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};
