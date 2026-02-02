/**
 * Mask phone number showing only last 2 digits
 * Example: 9876543210 -> xxxxx10
 * @param {string} phoneNumber - The phone number to mask
 * @returns {string} - Masked phone number
 */
const maskPhoneNumber = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return '';
    }
    
    const cleaned = phoneNumber.trim();
    if (cleaned.length < 2) {
        return 'xxxxx';
    }
    
    // Show last 2 digits, mask the rest
    const lastTwo = cleaned.slice(-2);
    return `xxxxx${lastTwo}`;
};

/**
 * Validate if phone number format is correct
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
};

module.exports = {
    maskPhoneNumber,
    isValidPhoneNumber
};
