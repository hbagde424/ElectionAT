# BLO Features - Deployment Checklist

## ✅ Pre-Deployment Checklist

### Backend Verification
- [ ] All new files created:
  - [ ] `Backend/utils/phoneUtils.js`
  - [ ] `Backend/scripts/addPerformanceRatingToBLOs.js`
  - [ ] `Backend/scripts/testPhoneMasking.js`

- [ ] All files modified:
  - [ ] `Backend/models/BLO.js` (performance_rating field)
  - [ ] `Backend/controllers/bloController.js` (OTP endpoints)
  - [ ] `Backend/routes/bloRoutes.js` (new routes)

- [ ] Dependencies installed:
  - [ ] bcryptjs (already installed ✓)
  - [ ] All other dependencies present

- [ ] Tests passing:
  - [ ] Run: `node Backend/scripts/testPhoneMasking.js`
  - [ ] Expected: 16/16 tests pass

### Frontend Verification
- [ ] All new files created:
  - [ ] `frontend/src/components/StarRating.jsx`
  - [ ] `frontend/src/components/MaskedPhoneNumber.jsx`

- [ ] All files modified:
  - [ ] `frontend/src/pages/curd/blo/BLOListPage.jsx`
  - [ ] `frontend/src/pages/curd/blo/BLOModal.jsx`

- [ ] Dependencies installed:
  - [ ] iconsax-react (already installed ✓)
  - [ ] @mui/material (already installed ✓)

- [ ] No syntax errors:
  - [ ] Run: `npm run lint` (if available)
  - [ ] Check: No console errors

### Documentation
- [ ] Documentation files created:
  - [ ] `BLO_PERFORMANCE_AND_PHONE_SECURITY.md`
  - [ ] `BLO_FEATURES_HINDI.md`
  - [ ] `BLO_IMPLEMENTATION_SUMMARY.md`
  - [ ] `QUICK_START_GUIDE.md`
  - [ ] `BLO_FEATURE_FLOW_DIAGRAM.md`
  - [ ] `DEPLOYMENT_CHECKLIST.md` (this file)

## 🚀 Deployment Steps

### Step 1: Backup Database
```bash
# Create backup before migration
mongodump --uri="mongodb://localhost:27017/electionat" --out=backup_$(date +%Y%m%d)
```
- [ ] Database backup created
- [ ] Backup verified and accessible

### Step 2: Deploy Backend

#### 2.1 Stop Backend Server
```bash
# Stop the running server
pm2 stop backend  # or your process manager
# OR
# Kill the process manually
```
- [ ] Backend server stopped

#### 2.2 Pull Latest Code
```bash
cd Backend
git pull origin main  # or your branch
```
- [ ] Latest code pulled
- [ ] All new files present

#### 2.3 Install Dependencies (if needed)
```bash
npm install
```
- [ ] Dependencies installed
- [ ] No installation errors

#### 2.4 Run Migration Script
```bash
node scripts/addPerformanceRatingToBLOs.js
```
- [ ] Migration completed successfully
- [ ] All BLO records updated
- [ ] Verification shows 100% coverage

#### 2.5 Test Phone Masking
```bash
node scripts/testPhoneMasking.js
```
- [ ] All tests pass (16/16)
- [ ] No errors in output

#### 2.6 Start Backend Server
```bash
npm start
# OR
pm2 start backend
```
- [ ] Server started successfully
- [ ] No startup errors
- [ ] Server responding to requests

### Step 3: Deploy Frontend

#### 3.1 Pull Latest Code
```bash
cd frontend
git pull origin main  # or your branch
```
- [ ] Latest code pulled
- [ ] All new files present

#### 3.2 Install Dependencies (if needed)
```bash
npm install
```
- [ ] Dependencies installed
- [ ] No installation errors

#### 3.3 Build for Production
```bash
npm run build
```
- [ ] Build completed successfully
- [ ] No build errors
- [ ] Build folder created

#### 3.4 Deploy Build
```bash
# Copy build to server
# Method depends on your deployment setup
# Example: rsync, scp, or manual copy
```
- [ ] Build deployed to server
- [ ] Static files accessible

#### 3.5 Restart Web Server
```bash
# Restart nginx/apache/etc.
sudo systemctl restart nginx
```
- [ ] Web server restarted
- [ ] Frontend accessible

### Step 4: Environment Configuration

#### 4.1 Backend Environment
```bash
# Edit Backend/.env
nano Backend/.env
```

Add/verify these variables:
```env
# OTP Configuration
CSV_OTP_MOBILE_NUMBER=+919876543210  # Optional
CSV_EXPORT_OTP_TTL_MINUTES=5
CSV_EXPORT_OTP_LENGTH=6

# For production
NODE_ENV=production
```
- [ ] Environment variables set
- [ ] OTP mobile number configured
- [ ] NODE_ENV set to production

#### 4.2 SMS Service Configuration
- [ ] SMS service credentials configured
- [ ] SMS service tested and working
- [ ] Test OTP can be sent

### Step 5: Verification Testing

#### 5.1 Backend API Testing
```bash
# Test BLO list endpoint
curl http://your-domain.com/api/blos \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] API responds successfully
- [ ] Phone numbers are masked (xxxxx89)
- [ ] Performance ratings present

```bash
# Test OTP request
curl -X POST http://your-domain.com/api/blos/BLO_ID/request-phone-otp \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] OTP request works
- [ ] SMS received
- [ ] Response includes requestId

```bash
# Test OTP verification
curl -X POST http://your-domain.com/api/blos/BLO_ID/verify-phone-otp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"REQUEST_ID","otp":"123456"}'
```
- [ ] OTP verification works
- [ ] Full phone number returned
- [ ] Invalid OTP rejected

#### 5.2 Frontend UI Testing
- [ ] BLO list page loads
- [ ] Performance column shows stars
- [ ] Phone numbers show as xxxxx89
- [ ] Eye icon visible next to phones
- [ ] Click eye icon opens OTP dialog
- [ ] OTP dialog shows masked destination
- [ ] Enter OTP and verify works
- [ ] Full phone number revealed
- [ ] Page refresh masks number again

#### 5.3 Form Testing
- [ ] Add BLO form opens
- [ ] Performance rating field visible
- [ ] Can select star rating
- [ ] Form saves successfully
- [ ] Rating persists in database
- [ ] Rating displays in list

### Step 6: Database Verification

#### 6.1 Check Schema
```javascript
// MongoDB Shell
use electionat
db.blos.findOne({}, {performance_rating: 1, contact_number: 1})
```
- [ ] performance_rating field exists
- [ ] Field type is Number
- [ ] Default value is 0

#### 6.2 Check Data
```javascript
// Count records with rating
db.blos.count({performance_rating: {$exists: true}})

// Count total records
db.blos.count()
```
- [ ] All records have performance_rating
- [ ] Coverage is 100%

### Step 7: Security Verification

#### 7.1 Phone Number Security
- [ ] API responses don't contain full numbers
- [ ] Only masked numbers in network tab
- [ ] OTP required to reveal numbers
- [ ] Numbers masked after page refresh

#### 7.2 OTP Security
- [ ] OTP expires after 5 minutes
- [ ] Max 5 attempts enforced
- [ ] Used OTP cannot be reused
- [ ] OTP stored as hash, not plain text

#### 7.3 Audit Trail
```javascript
// Check OTP tokens
db.otptokens.find({purpose: 'blo_phone_reveal'}).limit(5)
```
- [ ] OTP requests logged
- [ ] User info captured
- [ ] IP address logged
- [ ] Timestamps present

### Step 8: Performance Testing

#### 8.1 Load Testing
- [ ] List page loads in < 2 seconds
- [ ] Star ratings render smoothly
- [ ] Phone masking has no delay
- [ ] OTP request responds in < 5 seconds

#### 8.2 Stress Testing
- [ ] Multiple concurrent OTP requests work
- [ ] Large BLO lists (1000+) load fine
- [ ] No memory leaks observed
- [ ] Server remains stable

### Step 9: User Acceptance Testing

#### 9.1 Admin Testing
- [ ] Admin can add BLOs with ratings
- [ ] Admin can edit ratings
- [ ] Admin can view masked phones
- [ ] Admin can reveal phones with OTP

#### 9.2 User Testing
- [ ] Users see masked phones
- [ ] Users can request OTP
- [ ] Users receive SMS
- [ ] Users can verify and see full number

### Step 10: Monitoring Setup

#### 10.1 Logging
- [ ] Backend logs OTP requests
- [ ] Backend logs verification attempts
- [ ] Frontend logs errors to console
- [ ] Log rotation configured

#### 10.2 Alerts
- [ ] SMS failure alerts configured
- [ ] OTP expiry alerts (optional)
- [ ] Database error alerts
- [ ] Server health monitoring

## 📊 Post-Deployment Verification

### Immediate Checks (First Hour)
- [ ] No error logs in backend
- [ ] No console errors in frontend
- [ ] Users can access BLO list
- [ ] OTP flow works end-to-end
- [ ] SMS delivery working

### Short-term Checks (First Day)
- [ ] Performance metrics normal
- [ ] No user complaints
- [ ] OTP success rate > 95%
- [ ] SMS delivery rate > 95%
- [ ] Database performance normal

### Long-term Monitoring (First Week)
- [ ] Average rating usage tracked
- [ ] Phone reveal frequency monitored
- [ ] OTP failure rate < 5%
- [ ] User feedback collected
- [ ] Performance trends analyzed

## 🐛 Rollback Plan

### If Issues Occur

#### Backend Rollback
```bash
# Stop server
pm2 stop backend

# Restore previous version
git checkout previous-commit-hash

# Restart server
pm2 start backend
```

#### Database Rollback
```bash
# Restore from backup
mongorestore --uri="mongodb://localhost:27017/electionat" backup_YYYYMMDD/
```

#### Frontend Rollback
```bash
# Deploy previous build
# Or checkout previous version and rebuild
git checkout previous-commit-hash
npm run build
# Deploy build
```

### Rollback Checklist
- [ ] Backup current state before rollback
- [ ] Stop all services
- [ ] Restore code/database
- [ ] Restart services
- [ ] Verify functionality
- [ ] Notify users if needed

## 📝 Sign-off

### Deployment Team
- [ ] Backend Developer: _________________ Date: _______
- [ ] Frontend Developer: ________________ Date: _______
- [ ] Database Admin: ___________________ Date: _______
- [ ] QA Engineer: ______________________ Date: _______
- [ ] DevOps Engineer: __________________ Date: _______

### Approval
- [ ] Technical Lead: ____________________ Date: _______
- [ ] Project Manager: __________________ Date: _______

## 📞 Support Contacts

### Technical Issues
- Backend: [Contact Info]
- Frontend: [Contact Info]
- Database: [Contact Info]
- SMS Service: [Contact Info]

### Emergency Contacts
- On-call Engineer: [Contact Info]
- System Admin: [Contact Info]
- Project Manager: [Contact Info]

---

## 🎉 Deployment Complete!

Once all items are checked:
1. Mark deployment as complete
2. Update documentation
3. Notify stakeholders
4. Monitor for 24 hours
5. Collect user feedback

**Deployment Date**: _______________
**Deployed By**: _______________
**Status**: ⬜ In Progress  ⬜ Complete  ⬜ Rolled Back
