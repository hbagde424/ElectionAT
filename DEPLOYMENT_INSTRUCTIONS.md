# Backend Deployment Instructions

## Problem Fixed

✅ **Fixed missing candidateUpload.js config file**
✅ **Fixed all case sensitivity issues with model imports**
✅ **Created complete deployment package**

## Files Included in backend-fixed-complete.zip

- ✅ config/candidateUpload.js (CRITICAL - was missing on server)
- ✅ config/config.js
- ✅ config/db.js
- ✅ config/swagger.js
- ✅ All controllers with fixed model imports
- ✅ All models with correct casing
- ✅ All routes
- ✅ app.js, server.js, package.json

## Deployment Steps

### 1. Upload the Package

Upload `backend-fixed-complete.zip` to your server.

### 2. Backup Current Backend (IMPORTANT)

```bash
mv /home/bobpdgmw/public_html/backend /home/bobpdgmw/public_html/backend-backup
```

### 3. Create New Backend Directory

```bash
mkdir /home/bobpdgmw/public_html/backend
cd /home/bobpdgmw/public_html/backend
```

### 4. Extract the Package

```bash
unzip /path/to/backend-fixed-complete.zip
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Set Environment Variables

Make sure your `.env` file exists with proper database and other configurations.

### 7. Restart Server

Restart your Node.js server/application.

## What Was Fixed

### Case Sensitivity Issues Fixed:

- `require('../models/division')` → `require('../models/Division')`
- `require('../models/assembly')` → `require('../models/Assembly')`
- `require('../models/parliament')` → `require('../models/Parliament')`
- `require('../models/district')` → `require('../models/District')`

### Missing Config File:

- Added `config/candidateUpload.js` which was missing from production server

## Verification

After deployment, your server should no longer show these errors:

- ❌ `Cannot find module '../models/division'`
- ❌ `Cannot find module '../models/assembly'`
- ❌ `Cannot find module '../config/candidateUpload'`

## Package Details

- **File**: backend-fixed-complete.zip
- **Size**: ~243 KB
- **Created**: August 22, 2025
- **Contains**: Complete backend with all fixes applied
