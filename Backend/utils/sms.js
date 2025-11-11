// utils/sms.js
// SMS sending utility using custom SMS gateway API

const axios = require('axios');

const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'ELECAT';
const SMS_TEMPLATE_ID = process.env.SMS_TEMPLATE_ID;
const SMS_ROUTE = process.env.SMS_ROUTE || '1';
const SMS_API_URL = process.env.SMS_API_URL || 'http://216.48.180.220/vb/apikey.php';

async function sendSms(to, message) {
  if (!to) throw new Error('Destination mobile number required');
  if (!message) throw new Error('SMS message required');

  // Normalize mobile number (remove +91 prefix if present, ensure 10 digits)
  let cleanNumber = to.replace(/^\+91/, '').replace(/\D/g, '');
  if (cleanNumber.length === 10) {
    // Good, keep as is
  } else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
    cleanNumber = cleanNumber.substring(2);
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

  // If SMS API configured, use it
  if (SMS_API_KEY && SMS_SENDER_ID && SMS_TEMPLATE_ID) {
    try {
      const params = {
        apikey: SMS_API_KEY,
        senderid: SMS_SENDER_ID,
        templateid: SMS_TEMPLATE_ID,
        route: SMS_ROUTE,
        number: cleanNumber,
        message: encodeURIComponent(message)
      };

      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `${SMS_API_URL}?${queryString}`;

      console.log('📱 Sending SMS...');
      console.log('API URL:', SMS_API_URL);
      console.log('To:', cleanNumber);
      console.log('Message:', message);

      const response = await axios.get(fullUrl, { timeout: 10000 });
      
      console.log('SMS API Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.status === 'Success') {
        console.log(`✅ SMS sent successfully to ${cleanNumber}, MessageID: ${response.data.data?.messageid || 'N/A'}`);
        return true;
      } else {
        console.error('❌ SMS API error:', response.data);
        throw new Error(response.data?.description || 'SMS send failed');
      }
    } catch (err) {
      console.error('SMS send failed:', err.message);
      // Fallback to console in case of API failure
      console.log(`[SMS FALLBACK] to ${cleanNumber}: ${message}`);
      return false;
    }
  }

  // Fallback: log to console (development/testing)
  console.log(`[SMS DEV MODE] to ${cleanNumber}: ${message}`);
  return true;
}

module.exports = { sendSms };
