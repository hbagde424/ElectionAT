# CSV Download OTP Gating

This backend provides an OTP flow to gate CSV downloads from the admin UI. When any CSV export is triggered, an OTP is sent via SMS to the Super Admin's mobile number and the download proceeds only after successful OTP verification.

## Endpoints

### POST /api/csv-export/request-otp
- **Auth required**: Bearer token
- **Description**: Sends an OTP to the first active Super Admin's mobile number
- **Response**: 
```json
{
  "success": true,
  "requestId": "...",
  "to": "98******45",
  "expiresInMinutes": 5
}
```

### POST /api/csv-export/verify-otp
- **Auth required**: Bearer token
- **Body**: 
```json
{
  "requestId": "...",
  "otp": "123456"
}
```
- **Response**: 
```json
{
  "success": true,
  "message": "OTP verified"
}
```

## Environment Variables

Add these to your `.env` file:

```env
# SMS Gateway Configuration
SMS_API_KEY=your_api_key_here
SMS_SENDER_ID=ELECAT
SMS_TEMPLATE_ID=your_template_id_here
SMS_ROUTE=1
SMS_API_URL=http://216.48.180.220/vb/apikey.php

# OTP Settings (optional)
CSV_EXPORT_OTP_TTL_MINUTES=5
CSV_EXPORT_OTP_LENGTH=6
```

### Required Variables
- `SMS_API_KEY`: API key from your SMS provider (216.48.180.220)
- `SMS_SENDER_ID`: 6-character sender ID (default: ELECAT)
- `SMS_TEMPLATE_ID`: DLT registered template ID

### Optional Variables
- `SMS_ROUTE`: Route ID (default: 1)
- `SMS_API_URL`: SMS gateway URL (default: http://216.48.180.220/vb/apikey.php)
- `CSV_EXPORT_OTP_TTL_MINUTES`: OTP validity in minutes (default: 5)
- `CSV_EXPORT_OTP_LENGTH`: OTP digit length (default: 6)

## DLT Template Registration

You need to register a template with DLT (Distributed Ledger Technology) for SMS delivery in India:

**Template format**: `Your {#var#} CSV download OTP is {#var#}. It expires in {#var#} minutes.`

Replace variables:
- First `{#var#}`: App name (ElectionAT)
- Second `{#var#}`: OTP code
- Third `{#var#}`: Expiry time

## How It Works

1. User clicks CSV export button in any CRUD table
2. Frontend calls `/api/csv-export/request-otp`
3. Backend generates 6-digit OTP, hashes and stores it with 5-minute expiry
4. SMS sent to first active Super Admin's mobile number
5. Frontend shows OTP dialog
6. User enters OTP
7. Frontend calls `/api/csv-export/verify-otp` with OTP
8. Backend validates OTP (hash match, not expired, not used, < 5 attempts)
9. If valid, CSV download proceeds
10. OTP marked as used

## Security Features

- OTPs stored as bcrypt hashes (not plain text)
- Automatic expiry via MongoDB TTL index
- Max 5 verification attempts per OTP
- One-time use (marked as used after successful verification)
- Rate limiting on verification attempts

## Notes

- OTPs are sent to the **first active Super Admin** (role: 'superAdmin', isActive: true)
- Without SMS configuration, OTPs are logged to server console (development mode)
- Each OTP request generates a new unique token
- Old tokens auto-delete 1 minute after expiry
