# BLO Features - Flow Diagrams

## 📊 Performance Rating Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Performance Rating Flow                   │
└─────────────────────────────────────────────────────────────┘

User Action                Backend                 Database
    │                         │                        │
    │  1. Open BLO Form       │                        │
    ├────────────────────────>│                        │
    │                         │                        │
    │  2. Click Stars (4.5)   │                        │
    │  ⭐⭐⭐⭐⭐              │                        │
    │                         │                        │
    │  3. Save Form           │                        │
    ├────────────────────────>│                        │
    │                         │  4. Store Rating       │
    │                         ├───────────────────────>│
    │                         │  {performance_rating:  │
    │                         │   4.5}                 │
    │                         │                        │
    │                         │  5. Confirm Save       │
    │                         │<───────────────────────┤
    │  6. Show Success        │                        │
    │<────────────────────────┤                        │
    │                         │                        │
    │  7. View List           │                        │
    ├────────────────────────>│                        │
    │                         │  8. Fetch BLOs         │
    │                         ├───────────────────────>│
    │                         │                        │
    │                         │  9. Return Data        │
    │                         │<───────────────────────┤
    │  10. Display Stars      │                        │
    │  ⭐⭐⭐⭐⭐              │                        │
    │<────────────────────────┤                        │
    │                         │                        │
```

## 🔒 Phone Number Masking & OTP Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Phone Number Masking & OTP Flow                 │
└─────────────────────────────────────────────────────────────┘

User                    Frontend              Backend              SMS Service
 │                         │                      │                     │
 │  1. View BLO List       │                      │                     │
 ├────────────────────────>│                      │                     │
 │                         │  2. GET /blos        │                     │
 │                         ├─────────────────────>│                     │
 │                         │                      │                     │
 │                         │  3. Mask Numbers     │                     │
 │                         │  xxxxx89             │                     │
 │                         │<─────────────────────┤                     │
 │  4. See xxxxx89 👁️     │                      │                     │
 │<────────────────────────┤                      │                     │
 │                         │                      │                     │
 │  5. Click Eye Icon      │                      │                     │
 ├────────────────────────>│                      │                     │
 │                         │  6. Request OTP      │                     │
 │                         ├─────────────────────>│                     │
 │                         │                      │  7. Generate OTP    │
 │                         │                      │  (123456)           │
 │                         │                      │                     │
 │                         │                      │  8. Send SMS        │
 │                         │                      ├────────────────────>│
 │                         │                      │                     │
 │                         │  9. Return RequestID │  📱 SMS: OTP 123456│
 │                         │  & Masked Dest       │                     │
 │                         │<─────────────────────┤                     │
 │  10. OTP Dialog Opens   │                      │                     │
 │  "OTP sent to 91****89" │                      │                     │
 │<────────────────────────┤                      │                     │
 │                         │                      │                     │
 │  11. Enter OTP: 123456  │                      │                     │
 ├────────────────────────>│                      │                     │
 │                         │  12. Verify OTP      │                     │
 │                         ├─────────────────────>│                     │
 │                         │  {requestId, otp}    │                     │
 │                         │                      │  13. Validate OTP   │
 │                         │                      │  ✓ Match            │
 │                         │                      │  ✓ Not Expired      │
 │                         │                      │  ✓ Not Used         │
 │                         │                      │                     │
 │                         │  14. Return Full #   │                     │
 │                         │  9876543210          │                     │
 │                         │<─────────────────────┤                     │
 │  15. Display Full #     │                      │                     │
 │  9876543210             │                      │                     │
 │<────────────────────────┤                      │                     │
 │                         │                      │                     │
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
└─────────────────────────────────────────────────────────────┘

Layer 1: Server-Side Masking
┌──────────────────────────────────────┐
│  Database: 9876543210                │
│           ↓                          │
│  Backend:  maskPhoneNumber()         │
│           ↓                          │
│  API:      xxxxx10                   │
└──────────────────────────────────────┘

Layer 2: OTP Generation
┌──────────────────────────────────────┐
│  Random 6-digit: 123456              │
│           ↓                          │
│  Bcrypt Hash: $2a$10$...            │
│           ↓                          │
│  Store in DB with expiry             │
└──────────────────────────────────────┘

Layer 3: OTP Validation
┌──────────────────────────────────────┐
│  ✓ OTP matches hash                  │
│  ✓ Not expired (< 5 min)             │
│  ✓ Not used before                   │
│  ✓ Attempts < 5                      │
│           ↓                          │
│  Reveal full number                  │
└──────────────────────────────────────┘

Layer 4: Audit Trail
┌──────────────────────────────────────┐
│  Log: User ID, IP, Timestamp         │
│  Log: BLO ID, Action                 │
│  Log: Success/Failure                │
└──────────────────────────────────────┘
```

## 📱 Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Component Architecture                     │
└─────────────────────────────────────────────────────────────┘

Frontend Components
├── BLOListPage.jsx
│   ├── StarRating (read-only)
│   ├── MaskedPhoneNumber
│   │   ├── Eye Icon Button
│   │   └── OTP Dialog
│   │       ├── OTP Input
│   │       ├── Verify Button
│   │       └── Error Display
│   └── Table Columns
│       ├── BLA Name
│       ├── Performance ⭐
│       ├── Contact (masked)
│       └── Actions
│
└── BLOModal.jsx
    ├── Form Fields
    ├── StarRating (editable)
    └── Submit Handler

Backend Components
├── models/BLO.js
│   └── performance_rating field
│
├── controllers/bloController.js
│   ├── getBLOs() → masks phones
│   ├── requestPhoneOtp()
│   └── verifyPhoneOtp()
│
├── routes/bloRoutes.js
│   ├── POST /:id/request-phone-otp
│   └── POST /:id/verify-phone-otp
│
└── utils/phoneUtils.js
    ├── maskPhoneNumber()
    └── isValidPhoneNumber()
```

## 🎯 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Data Flow                             │
└─────────────────────────────────────────────────────────────┘

Create/Update BLO
─────────────────
User Input → Form State → API Request → Backend Validation
                                              ↓
                                        Database Save
                                              ↓
                                        Response → UI Update

View BLO List
─────────────
User Request → API Call → Backend Query → Database Fetch
                                              ↓
                                        Mask Phone Numbers
                                              ↓
                                        Response → Render Table

Reveal Phone Number
───────────────────
Click Eye → Request OTP → Generate & Send → SMS Delivery
                                              ↓
Enter OTP → Verify → Validate → Return Full Number
                                              ↓
                                        Display in UI
```

## 🔄 State Management

```
┌─────────────────────────────────────────────────────────────┐
│                     State Management                         │
└─────────────────────────────────────────────────────────────┘

BLOListPage State
├── BLOs: []                    // List of BLOs
├── loading: false              // Loading state
├── filters: {}                 // Applied filters
├── pagination: {}              // Page info
└── sorting: []                 // Sort config

MaskedPhoneNumber State
├── otpDialogOpen: false        // Dialog visibility
├── otpCode: ''                 // OTP input
├── requestId: ''               // OTP request ID
├── loading: false              // Request state
├── error: ''                   // Error message
├── revealedNumber: ''          // Full number
└── maskedDest: ''              // SMS destination

BLOModal State
├── formData: {}                // Form fields
│   ├── blo_name
│   ├── contact_number
│   ├── performance_rating: 0
│   └── ...hierarchy fields
├── errors: {}                  // Validation errors
├── isSubmitting: false         // Submit state
└── submitError: ''             // Submit error
```

## 📈 Performance Metrics

```
┌─────────────────────────────────────────────────────────────┐
│                    Performance Metrics                       │
└─────────────────────────────────────────────────────────────┘

Phone Masking
├── Time Complexity: O(1)
├── Space Complexity: O(1)
├── Overhead: ~10 bytes per record
└── Impact: Negligible

OTP Generation
├── Time: ~50ms (bcrypt hash)
├── SMS Delivery: ~2-5 seconds
├── Database Write: ~10ms
└── Total: ~3-5 seconds

OTP Verification
├── Hash Compare: ~50ms
├── Database Query: ~10ms
├── Validation: ~1ms
└── Total: ~60ms

Star Rating
├── Render Time: <16ms (60fps)
├── Component Size: ~2KB
├── Re-render: Optimized with memo
└── Impact: None
```

## 🎨 UI States

```
┌─────────────────────────────────────────────────────────────┐
│                        UI States                             │
└─────────────────────────────────────────────────────────────┘

Phone Number Display States
├── Initial:    xxxxx89 👁️
├── Loading:    xxxxx89 ⏳
├── OTP Dialog: [Enter OTP]
├── Verifying:  [Verifying...] ⏳
├── Success:    9876543210 ✓
└── Error:      xxxxx89 ❌ [Error message]

Star Rating States
├── Empty:      ☆☆☆☆☆ (0.0)
├── Partial:    ★★★☆☆ (3.0)
├── Full:       ★★★★★ (5.0)
├── Half:       ★★★★☆ (4.5)
└── Hover:      ★★★★☆ (Interactive)
```

---

## 📝 Legend

```
Symbols Used:
├── Tree branch
│   Vertical line
└── Tree end
→   Flow direction
↓   Downward flow
✓   Success/Valid
❌  Error/Invalid
⭐  Star rating
👁️  Eye icon (reveal)
📱  Mobile/SMS
🔒  Security/Lock
⏳  Loading
```
