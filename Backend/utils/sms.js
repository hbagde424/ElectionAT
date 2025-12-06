// utils/sms.js
// SMS sending utility using custom SMS gateway API with real configuration

const axios = require('axios');
const smsConfig = require('../config/smsConfig');

/**
 * Send SMS using the configured SMS gateway
 * @param {string} to - Mobile number (10 digits or with country code)
 * @param {string} message - Message to send
 * @param {object} options - Optional parameters like templateId override
 * @returns {Promise<boolean>} - Success status
 */
async function sendSms(to, message, options = {}) {
  if (!to) throw new Error('Destination mobile number required');
  if (!message) throw new Error('SMS message required');

  // Normalize mobile number (remove +91 prefix if present, ensure 10 digits)
  let cleanNumber = to.replace(/^\+91/, '').replace(/\D/g, '');
  if (cleanNumber.length === 10) {
    // Add 91 prefix for API
    cleanNumber = '91' + cleanNumber;
  } else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
    // Already has 91 prefix, keep as is
  } else if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber;
  }

  // Development mode: Always log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('\n' + '='.repeat(70));
    console.log('📱 SMS PREVIEW (Development Mode)');
    console.log('='.repeat(70));
    console.log(`To: ${cleanNumber}`);
    console.log(`Message: ${message}`);
    console.log('='.repeat(70) + '\n');
  }

  try {
    // Use real SMS configuration
    const templateId = options.templateId || smsConfig.templateId;

    // Build URL with query parameters
    const url = `${smsConfig.apiUrl}?apikey=${smsConfig.apiKey}&senderid=${smsConfig.senderId}&templateid=${templateId}&number=${cleanNumber}&message=${encodeURIComponent(message)}`;

    console.log('📱 Sending SMS via Real Gateway...');
    console.log('API URL:', smsConfig.apiUrl);
    console.log('Sender ID:', smsConfig.senderId);
    console.log('Template ID:', templateId);
    console.log('To:', cleanNumber);
    console.log('Message:', message);

    const response = await axios.get(url, { timeout: 10000 });

    console.log('SMS API Response:', JSON.stringify(response.data, null, 2));

    // Check for successful response
    // The API might return different response formats, so we check multiple conditions
    if (response.data) {
      const data = response.data;

      // Success scenarios
      if (data.status === 'Success' || data.Status === 'Success' ||
        data.status === 'success' || data.Status === 'success' ||
        (data.ErrorCode === '000' || data.errorCode === '000')) {
        console.log(`✅ SMS sent successfully to ${cleanNumber}`);
        if (data.MessageID || data.messageid || data.messageId) {
          console.log(`Message ID: ${data.MessageID || data.messageid || data.messageId}`);
        }
        return true;
      } else {
        console.error('❌ SMS API error:', data);
        // In development, still return true for testing
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Continuing in development mode despite API error');
          return true;
        }
        throw new Error(data.description || data.Description || data.message || 'SMS send failed');
      }
    }

    return true;
  } catch (err) {
    console.error('SMS send failed:', err.message);

    // In development mode, log but don't fail
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS DEV FALLBACK] to ${cleanNumber}: ${message}`);
      return true;
    }

    // In production, throw error
    throw err;
  }
}

/**
 * Format OTP message using template
 * @param {string} otp - OTP code
 * @param {number} ttlMinutes - Time to live in minutes
 * @param {string} template - Template to use (default: otpTemplate)
 * @returns {string} - Formatted message
 */
function formatOtpMessage(otp, ttlMinutes = 5, template = null) {
  const messageTemplate = template || smsConfig.otpTemplate;

  return messageTemplate
    .replace('{BRAND}', smsConfig.brand)
    .replace('{OTP}', otp)
    .replace('{TTL}', ttlMinutes)
    .replace('{SIGN}', smsConfig.signature);
}

module.exports = { sendSms, formatOtpMessage };
