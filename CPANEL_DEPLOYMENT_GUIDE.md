# 🚀 Complete cPanel Deployment Guide for ElectionAT

## 📋 Prerequisites

1. **cPanel Shared Hosting Account** with:

   - Node.js support (check with your hosting provider)
   - File Manager access
   - Domain/subdomain configured

2. **Database Setup**:

   - MongoDB Atlas account (recommended) OR
   - MongoDB instance accessible from your hosting

3. **Domain Configuration**:
   - Main domain: `yourdomain.com` (Frontend)
   - API subdomain: `api.yourdomain.com` OR `yourdomain.com/api` (Backend)

---

## 🎯 Phase 1: Backend Deployment (Node.js)

### Step 1: Prepare Backend Files

1. **Run the deployment script**:
   ```powershell
   .\deploy-backend.ps1
   ```
   This creates `backend-deployment.zip` with all necessary files.

### Step 2: Upload to cPanel

1. **Login to cPanel** → **File Manager**
2. **Navigate to** `/public_html/`
3. **Create folder**: `api` (or `backend`)
4. **Upload** `backend-deployment.zip` to the `api` folder
5. **Extract** the zip file
6. **Delete** the zip file after extraction

### Step 3: Configure Environment Variables

1. **Edit the `.env` file** in your `/public_html/api/` directory:

   ```env
   NODE_ENV=production
   PORT=3000
   MONGO_URI=your_production_mongodb_connection_string
   JWT_SECRET=your_super_secure_jwt_secret_for_production
   JWT_EXPIRE=30d
   BASE_URL=https://yourdomain.com
   ```

2. **MongoDB Setup**:

   - **Option A**: Use MongoDB Atlas (recommended)

     - Create cluster at [mongodb.com](https://cloud.mongodb.com/)
     - Get connection string
     - Whitelist your hosting IP

   - **Option B**: Use hosting provider's MongoDB (if available)

### Step 4: Setup Node.js Application in cPanel

1. **Go to cPanel** → **Node.js App** (or **Node.js Selector**)

2. **Create New Application**:

   - **Node.js Version**: Latest LTS (18.x or 20.x)
   - **Application Mode**: Production
   - **Application Root**: `api` (or `backend`)
   - **Application URL**: `yourdomain.com/api`
   - **Application Startup File**: `server.js`

3. **Click "Create"**

### Step 5: Install Dependencies

1. **In cPanel Node.js interface**:
   - Click **"NPM Install"** or **"Install Dependencies"**
2. **OR via Terminal** (if available):
   ```bash
   cd /home/username/public_html/api
   npm install --production
   ```

### Step 6: Start the Application

1. **In cPanel Node.js interface**:

   - Click **"Start App"** or **"Restart App"**

2. **Test your API**:
   - Visit: `https://yourdomain.com/api`
   - Should see your API response

---

## 🎨 Phase 2: Frontend Deployment (React.js)

### Step 1: Update Production Configuration

1. **Edit** `frontend/.env.production`:
   ```env
   PUBLIC_URL = https://yourdomain.com
   VITE_APP_BASE_NAME = /
   VITE_APP_API_URL = https://yourdomain.com/api
   ```

### Step 2: Build React Application

1. **Run the deployment script**:
   ```powershell
   .\deploy-frontend.ps1
   ```
   This creates `frontend-deployment.zip` with production build.

### Step 3: Upload to cPanel

1. **In cPanel File Manager**:

   - Go to `/public_html/`
   - **Backup existing files** (if any)
   - **Upload** `frontend-deployment.zip`
   - **Extract** directly in `/public_html/`
   - **Delete** the zip file

2. **Verify Structure**:
   ```
   /public_html/
   ├── index.html          (Main entry point)
   ├── assets/            (JS, CSS, images)
   ├── api/               (Your backend)
   └── other static files
   ```

### Step 4: Configure URL Routing (for SPA)

Create `.htaccess` file in `/public_html/`:

```apache
# Handle React Router
<IfModule mod_rewrite.c>
  RewriteEngine On

  # Handle Angular and React Routes
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header always set X-Frame-Options DENY
  Header always set X-Content-Type-Options nosniff
  Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache Control
<IfModule mod_expires.c>
  ExpiresActive on
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
</IfModule>
```

---

## 🔧 Phase 3: Testing & Troubleshooting

### Test Your Deployment

1. **Frontend Test**:

   - Visit: `https://yourdomain.com`
   - Check browser console for errors
   - Test navigation and functionality

2. **Backend Test**:
   - Visit: `https://yourdomain.com/api`
   - Test API endpoints
   - Check database connectivity

### Common Issues & Solutions

#### ❌ **Node.js App Won't Start**

- **Check Node.js version compatibility**
- **Verify package.json startup script**
- **Check error logs in cPanel**
- **Ensure all dependencies are installed**

#### ❌ **API Calls Failing**

- **Verify CORS settings in backend**
- **Check API URL in frontend .env**
- **Ensure SSL certificate is working**
- **Check network/firewall restrictions**

#### ❌ **Database Connection Issues**

- **Verify MongoDB connection string**
- **Check IP whitelist in MongoDB Atlas**
- **Ensure database credentials are correct**
- **Test connection from hosting environment**

#### ❌ **React Routes Not Working**

- **Ensure .htaccess is configured**
- **Check if mod_rewrite is enabled**
- **Verify file permissions**

### Performance Optimization

1. **Enable Gzip Compression** (in .htaccess)
2. **Optimize Images** and assets
3. **Use CDN** for static assets
4. **Implement Caching** strategies
5. **Minify** CSS and JavaScript

---

## 📝 Final Checklist

### Before Going Live:

- [ ] **Environment variables** are set correctly
- [ ] **Database** is accessible and populated
- [ ] **API endpoints** are working
- [ ] **Frontend** loads without errors
- [ ] **React routing** works properly
- [ ] **SSL certificate** is installed
- [ ] **Error handling** is in place
- [ ] **Performance** is optimized
- [ ] **Security headers** are configured
- [ ] **Backup** strategy is implemented

### Post-Deployment:

- [ ] **Monitor** application logs
- [ ] **Test** all functionality
- [ ] **Setup** monitoring and alerts
- [ ] **Document** any custom configurations
- [ ] **Plan** for updates and maintenance

---

## 🆘 Support Resources

- **cPanel Documentation**: Check your hosting provider's docs
- **Node.js Troubleshooting**: Most shared hosts have specific Node.js guides
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com/)
- **React Deployment**: [vitejs.dev/guide/static-deploy](https://vitejs.dev/guide/static-deploy.html)

---

## 🔄 Future Updates

For updates:

1. **Backend**: Upload new files, restart Node.js app
2. **Frontend**: Build new version, upload to public_html
3. **Database**: Handle migrations carefully
4. **Environment**: Update .env files as needed

---

**Good luck with your deployment! 🚀**
