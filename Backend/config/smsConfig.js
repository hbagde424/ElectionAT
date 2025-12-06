// Centralized SMS configuration (environment-independent)
// Adjust values here to match your provider and DLT-approved template

module.exports = {
    apiUrl: 'http://216.48.180.220/vb/apikey.php',
    apiKey: 'hdNhqlbtPSqBWt9G',
    senderId: 'UMANGS',
    templateId: '1707176484265285320', // numeric template id from provider panel
    route: '4', // Transactional/OTP route

    // Template controls
    brand: 'Election Atlas',
    signature: 'Umang Singhar',

    // DLT-compliant message template; keep exact wording/format as approved
    otpTemplate: 'Your {BRAND} CSV download OTP is ({OTP}). Valid for {TTL} minutes. Do not share with anyone. {SIGN}',

    // Booth Volunteer OTP template
    boothVolunteerOtpTemplate: 'Your {BRAND} Booth Volunteer OTP is ({OTP}). Valid for {TTL} minutes. Do not share with anyone. {SIGN}'
};
