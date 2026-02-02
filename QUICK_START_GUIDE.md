# BLO Features - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Run Migration (Optional - for existing data)
```bash
cd Backend
node scripts/addPerformanceRatingToBLOs.js
```

### Step 2: Restart Backend
```bash
cd Backend
npm restart
```

### Step 3: Test Phone Masking (Optional)
```bash
cd Backend
node scripts/testPhoneMasking.js
```

### Step 4: Configure Environment (if needed)
```bash
# Backend/.env
CSV_OTP_MOBILE_NUMBER=+919876543210  # Optional
NODE_ENV=development  # For testing
```

## ✨ Using the Features

### 1. Add Performance Rating
1. Open BLO list page
2. Click "Add BLO Officer" or edit existing
3. Find "Performance Rating" field
4. Click stars to rate (0-5)
5. Save

### 2. View Masked Phone Numbers
1. Open BLO list page
2. Phone numbers show as `xxxxx89`
3. Click eye icon (👁️) to reveal
4. Enter OTP from SMS
5. Click "Verify & Reveal"
6. Full number displayed

## 🧪 Testing in Development Mode

### Auto-Fill OTP
In development mode:
- OTP printed in console
- OTP auto-filled in dialog
- No SMS required for testing

### Check Console
```
==========================================================
🔐 BLO PHONE REVEAL OTP (Development Mode)
==========================================================
OTP: 123456
BLO: राजेश कुमार
Mobile: 91******89
Expires in: 5 minutes
==========================================================
```

## 📱 API Testing

### Request OTP
```bash
curl -X POST http://localhost:5000/api/blos/BLO_ID/request-phone-otp \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/blos/BLO_ID/verify-phone-otp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"REQUEST_ID","otp":"123456"}'
```

## 🔍 Verification

### Check Database
```javascript
// MongoDB Shell
db.blos.findOne({}, {performance_rating: 1, contact_number: 1})

// Should show:
{
  "_id": ObjectId("..."),
  "performance_rating": 0,
  "contact_number": "9876543210"
}
```

### Check API Response
```javascript
// Network tab in browser
// GET /api/blos response should show:
{
  "contact_number": "xxxxx10",
  "contact_number_masked": "xxxxx10"
}
```

## ⚡ Common Commands

### Backend
```bash
# Start server
npm start

# Run migration
node scripts/addPerformanceRatingToBLOs.js

# Test phone masking
node scripts/testPhoneMasking.js

# Check logs
tail -f logs/app.log
```

### Frontend
```bash
# Start dev server
npm start

# Build for production
npm run build

# Check for errors
npm run lint
```

## 🎯 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| OTP not received | Check console in dev mode |
| Phone not masked | Clear cache, restart backend |
| Stars not showing | Check iconsax-react installed |
| Rating not saving | Check network tab for errors |

## 📊 Feature Status

- ✅ Performance Rating: Working
- ✅ Phone Masking: Working
- ✅ OTP Verification: Working
- ✅ Migration Script: Ready
- ✅ Test Suite: Passing (100%)

## 🎉 You're Ready!

All features are implemented and tested. Start using them right away!

For detailed documentation, see:
- `BLO_PERFORMANCE_AND_PHONE_SECURITY.md` (English)
- `BLO_FEATURES_HINDI.md` (Hindi)
- `BLO_IMPLEMENTATION_SUMMARY.md` (Technical details)
