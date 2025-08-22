# Backend Deployment Instructions

## Problems Fixed

✅ **Fixed missing candidateUpload.js config file**
✅ **Fixed all case sensitivity issues with model imports**
✅ **Fixed missing roleRoutes.js and ALL route files**
✅ **Created COMPLETE deployment package**

## Files Included in backend-COMPLETE-FIXED.zip

- ✅ config/candidateUpload.js (CRITICAL - was missing on server)
- ✅ config/config.js, db.js, swagger.js
- ✅ routes/roleRoutes.js (CRITICAL - was missing in previous deployment)
- ✅ ALL 63 route files included
- ✅ ALL 62 controller files with fixed model imports
- ✅ ALL 62 model files with correct casing
- ✅ ALL middleware files
- ✅ ALL utility files
- ✅ app.js, server.js, package.json
- ✅ Complete file structure (169MB of files)

## Deployment Steps

### 1. Upload the Package

Upload `backend-COMPLETE-FIXED.zip` to your server.

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

### Missing Route Files:

- Added `routes/roleRoutes.js` and ALL route files which were missing from previous deployment

## Verification

After deployment, your server should no longer show these errors:

- ❌ `Cannot find module '../models/division'`
- ❌ `Cannot find module '../models/assembly'`
- ❌ `Cannot find module '../config/candidateUpload'`
- ❌ `Cannot find module './routes/roleRoutes'`

## Package Details

- **File**: backend-COMPLETE-FIXED.zip
- **Size**: ~26MB (complete with all files)
- **Created**: August 22, 2025
- **Contains**: COMPLETE backend with ALL fixes applied (231 files, 169MB uncompressed)
