// utils/sms.js
// Basic SMS sending abstraction. In production integrate with a provider like Twilio, MSG91, etc.

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_FROM_NUMBER;

let twilioClient = null;
if (twilioSid && twilioAuth) {
  try {
    twilioClient = require('twilio')(twilioSid, twilioAuth);
  } catch (e) {
    console.warn('Twilio initialization failed, falling back to console logging SMS. Reason:', e.message);
  }
}

async function sendSms(to, message) {
  if (!to) throw new Error('Destination mobile number required');
  if (!message) throw new Error('SMS message required');

  // If Twilio configured use it
  if (twilioClient && twilioFrom) {
    try {
      await twilioClient.messages.create({ body: message, from: twilioFrom, to: `+91${to}`.replace(/\+91\+91/, '+91') });
      return true;
    } catch (err) {
      console.error('Twilio SMS send failed, fallback to console:', err.message);
    }
  }

  // Fallback: log to console (development/testing)
  console.log(`SMS to ${to}: ${message}`);
  return true;
}

module.exports = { sendSms };
