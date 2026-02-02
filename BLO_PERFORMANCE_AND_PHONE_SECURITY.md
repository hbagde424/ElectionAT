# BLO Performance Rating & Phone Number Security Features

## Overview
This document describes the new features added to the BLO (Booth Level Officer) management system:
1. **Performance Rating System** - Star-based rating (0-5 stars)
2. **Phone Number Masking** - Security feature to protect contact information
3. **OTP Verification** - Required to reveal full phone numbers

## Features Implemented

### 1. Performance Rating System

#### Backend Changes
- **Model Update** (`Backend/models/BLO.js`):
  - Added `performance_rating` field (Number, 0-5 range)
  - Default value: 0
  - Validation: min 0, max 5

#### Frontend Changes
- **Star Rating Component** (`frontend/src/components/StarRating.jsx`):
  - Displays 1-5 stars
  - Supports read-only and editable modes
  - Shows numeric label (e.g., "4.5")
  - Uses Material-UI Rating component with custom icons

- **BLO List Page**:
  - Added "Performance" column showing star ratings
  - Displays in table and drawer views

- **BLO Modal Form**:
  - Added performance rating input field
  - Users can rate BLOs during create/edit operations
  - Interactive star selection

### 2. Phone Number Masking

#### Backend Changes
- **Phone Utility** (`Backend/utils/phoneUtils.js`):
  - `maskPhoneNumber()` - Masks phone showing only last 2 digits
  - Example: `9876543210` → `xxxxx10`
  - `isValidPhoneNumber()` - Validates phone format

- **Controller Update** (`Backend/controllers/bloController.js`):
  - Modified `getBLOs()` to automatically mask phone numbers in responses
  - Adds `contact_number_masked` field to response
  - Original number hidden from API responses

#### Frontend Changes
- **Masked Phone Component** (`frontend/src/components/MaskedPhoneNumber.jsx`):
  - Displays masked phone number (e.g., `xxxxx89`)
  - Shows eye icon button to reveal full number
  - Handles OTP flow for verification

### 3. OTP Verification for Phone Reveal

#### Backend Changes
- **New Endpoints** (`Backend/routes/bloRoutes.js`):
  ```
  POST /api/blos/:id/request-phone-otp
  POST /api/blos/:id/verify-phone-otp
  ```

- **Controller Functions** (`Backend/controllers/bloController.js`):
  - `requestPhoneOtp()`:
    - Generates 6-digit OTP
    - Sends SMS to super admin or configured number
    - Returns masked destination number
    - OTP expires in 5 minutes
    - In development mode, OTP is logged to console
  
  - `verifyPhoneOtp()`:
    - Validates OTP code
    - Checks expiration and attempt limits (max 5 attempts)
    - Returns full phone number on success
    - Marks OTP as used

#### Frontend Changes
- **OTP Dialog**:
  - Triggered when user clicks eye icon on masked phone
  - Shows masked destination (e.g., `91******89`)
  - Input field for OTP code
  - Auto-fills OTP in development mode
  - Verify button to submit OTP
  - Error handling for invalid/expired OTPs

## Usage Flow

### Viewing BLO Performance
1. Navigate to BLO list page
2. Performance column shows star ratings for each BLO
3. Hover over stars to see exact rating value
4. Click on BLO to see details with rating

### Adding/Editing Performance Rating
1. Click "Add BLO Officer" or edit existing BLO
2. In the form, find "Performance Rating" field
3. Click on stars to set rating (0-5, half-star precision)
4. Save the form

### Revealing Phone Numbers
1. In BLO list, phone numbers show as `xxxxx89`
2. Click the eye icon next to masked number
3. OTP dialog appears showing destination number
4. Enter OTP received via SMS
5. Click "Verify & Reveal"
6. Full phone number is displayed
7. Number remains visible until page refresh

## Security Features

### Phone Number Protection
- All phone numbers are masked by default in API responses
- Only last 2 digits visible (e.g., `xxxxx89`)
- Original numbers never sent to frontend without OTP verification

### OTP Security
- 6-digit random OTP
- 5-minute expiration
- Maximum 5 verification attempts
- One-time use (cannot reuse same OTP)
- Sent to super admin or configured secure number
- Logged in database with metadata (user, IP, timestamp)

### Development Mode
- OTP automatically displayed in console
- OTP included in API response for testing
- Auto-filled in OTP dialog for convenience

## Configuration

### Environment Variables
```env
# OTP destination (optional, defaults to super admin mobile)
CSV_OTP_MOBILE_NUMBER=+919876543210

# OTP settings (optional)
CSV_EXPORT_OTP_TTL_MINUTES=5
CSV_EXPORT_OTP_LENGTH=6

# Enable development mode features
NODE_ENV=development
```

## Database Schema

### BLO Model Addition
```javascript
{
  performance_rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}
```

### OTP Token Model (Existing)
```javascript
{
  purpose: 'blo_phone_reveal',
  codeHash: String,
  sentTo: String,
  createdBy: ObjectId,
  expiresAt: Date,
  usedAt: Date,
  attempts: Number,
  meta: {
    bloId: ObjectId,
    requestedBy: Object,
    userAgent: String,
    ip: String
  }
}
```

## API Examples

### Request Phone OTP
```bash
POST /api/blos/507f1f77bcf86cd799439011/request-phone-otp
Authorization: Bearer <token>

Response:
{
  "success": true,
  "requestId": "507f1f77bcf86cd799439012",
  "to": "91******89",
  "expiresInMinutes": 5,
  "devOtp": "123456" // Only in development
}
```

### Verify Phone OTP
```bash
POST /api/blos/507f1f77bcf86cd799439011/verify-phone-otp
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestId": "507f1f77bcf86cd799439012",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "OTP verified",
  "phoneNumber": "9876543210"
}
```

## Testing

### Test Performance Rating
1. Create/edit a BLO
2. Set performance rating to 4.5 stars
3. Save and verify in list view
4. Check database: `db.blos.findOne({}, {performance_rating: 1})`

### Test Phone Masking
1. View BLO list
2. Verify phone shows as `xxxxx89` format
3. Check network tab - API response should have masked number
4. Original number should not be in response

### Test OTP Flow
1. Click eye icon on masked phone
2. Check console for OTP (development mode)
3. Enter OTP in dialog
4. Verify full number is revealed
5. Refresh page - number should be masked again

## Troubleshooting

### OTP Not Received
- Check SMS configuration in `Backend/utils/sms.js`
- Verify `CSV_OTP_MOBILE_NUMBER` in environment
- Check console logs for OTP in development mode
- Verify super admin has valid mobile number

### Phone Number Not Masking
- Clear browser cache
- Check API response in network tab
- Verify `maskPhoneNumber` is called in controller
- Check if `contact_number_masked` field exists in response

### Stars Not Displaying
- Verify `iconsax-react` package is installed
- Check browser console for import errors
- Ensure Material-UI Rating component is available
- Verify `performance_rating` field exists in database

## Future Enhancements

1. **Performance Analytics**:
   - Average rating per region
   - Performance trends over time
   - Top-rated BLOs dashboard

2. **Enhanced Security**:
   - Role-based phone reveal permissions
   - Audit log for phone number access
   - Configurable OTP length and expiry

3. **Rating Features**:
   - Comments/feedback with ratings
   - Rating history tracking
   - Automated performance reports

## Support

For issues or questions:
1. Check console logs for errors
2. Verify environment configuration
3. Test in development mode first
4. Review API responses in network tab
