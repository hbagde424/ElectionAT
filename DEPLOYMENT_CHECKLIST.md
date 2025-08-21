# 🚀 Quick Deployment Checklist

## Before You Start

- [ ] cPanel hosting account with Node.js support
- [ ] MongoDB database (Atlas recommended)
- [ ] Domain name configured
- [ ] SSL certificate (Let's Encrypt via cPanel)

## Backend Deployment (30 minutes)

- [ ] Run `.\deploy-backend.ps1`
- [ ] Upload `backend-deployment.zip` to cPanel `/public_html/api/`
- [ ] Extract files in cPanel File Manager
- [ ] Update `.env` file with production values:
  - [ ] MONGO_URI
  - [ ] JWT_SECRET
  - [ ] BASE_URL
- [ ] Create Node.js app in cPanel:
  - [ ] Version: Latest LTS
  - [ ] Root: `api`
  - [ ] Startup: `server.js`
- [ ] Run NPM Install in cPanel
- [ ] Start the app
- [ ] Test API: `https://yourdomain.com/api`

## Frontend Deployment (20 minutes)

- [ ] Update `frontend/.env.production` with your domain
- [ ] Run `.\deploy-frontend.ps1`
- [ ] Upload `frontend-deployment.zip` to cPanel `/public_html/`
- [ ] Extract files in `/public_html/` root
- [ ] Ensure `.htaccess` is uploaded for SPA routing
- [ ] Test website: `https://yourdomain.com`

## Final Verification

- [ ] Frontend loads without errors
- [ ] API endpoints work
- [ ] Database connectivity confirmed
- [ ] React routing works (test navigation)
- [ ] Console shows no critical errors
- [ ] Mobile responsiveness check

## Common Issues

❌ **Node.js won't start**: Check version compatibility
❌ **API 404 errors**: Verify cPanel app setup
❌ **Database errors**: Check MongoDB connection string
❌ **React routes 404**: Ensure .htaccess is configured
❌ **CORS errors**: Check backend CORS settings

## Need Help?

1. Check cPanel error logs
2. Test API endpoints individually
3. Verify environment variables
4. Contact hosting support for Node.js issues

**Estimated Total Time: 1 hour** ⏱️
