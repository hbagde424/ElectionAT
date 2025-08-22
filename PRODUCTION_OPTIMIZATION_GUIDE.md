# 🚀 Production Optimization Guide for ElectionAT

## 🎯 Current Deployment Status

- **Frontend**: https://mbnmediaconsulting.in/election/
- **Backend**: https://mbnmediaconsulting.in/backend/ (Node.js 20.19.3)

---

## 🔧 Backend Optimization Checklist

### 1. Environment Configuration

```bash
# Check your current .env file in /public_html/backend/
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-super-secure-secret-256-bits
JWT_EXPIRE=30d
CORS_ORIGIN=https://mbnmediaconsulting.in
API_BASE_URL=https://mbnmediaconsulting.in/backend
```

### 2. Performance Optimizations

#### Add to your server.js (if not already present):

```javascript
// Enable gzip compression
const compression = require("compression");
app.use(compression());

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  next();
});

// Rate limiting
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});
app.use("/api/", limiter);
```

### 3. Database Connection Optimization

```javascript
// Add to your MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
  bufferMaxEntries: 0, // Disable mongoose buffering
});
```

---

## 🎨 Frontend Optimization Checklist

### 1. Update Frontend Environment Variables

Create/update `frontend/.env.production`:

```env
VITE_APP_API_URL=https://mbnmediaconsulting.in/backend
VITE_APP_BASE_NAME=/election
PUBLIC_URL=https://mbnmediaconsulting.in/election
VITE_APP_ENVIRONMENT=production
```

### 2. Build Optimizations

Add to your `vite.config.mjs`:

```javascript
export default defineConfig({
  base: "/election/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          mui: ["@mui/material", "@mui/icons-material"],
          utils: ["axios", "react-router-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

### 3. Add Service Worker for Caching

Create `public/sw.js`:

```javascript
const CACHE_NAME = "election-at-v1";
const urlsToCache = [
  "/election/",
  "/election/static/js/bundle.js",
  "/election/static/css/main.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## 🛡️ Security Enhancements

### 1. SSL/HTTPS Configuration

Ensure your cPanel has SSL enabled:

- Go to cPanel → SSL/TLS → Let's Encrypt (free)
- Enable "Force HTTPS Redirect"

### 2. htaccess Security (Frontend)

Create/update `/public_html/election/.htaccess`:

```apache
# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Disable server signature
ServerTokens Prod

# Hide Apache version
ServerSignature Off

# Prevent access to sensitive files
<FilesMatch "\.(env|log|json)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Enable gzip compression
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

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# React Router support
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /election/

    # Handle existing files and directories
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # Redirect all requests to index.html
    RewriteRule . /election/index.html [L]
</IfModule>
```

---

## 📊 Monitoring & Maintenance

### 1. Error Logging (Backend)

Add to your server.js:

```javascript
// Error logging middleware
app.use((err, req, res, next) => {
  console.error(`${new Date().toISOString()} - ${err.stack}`);

  if (process.env.NODE_ENV === "production") {
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  } else {
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }
});
```

### 2. Health Check Endpoint

Add to your backend routes:

```javascript
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  });
});
```

---

## 🚀 Deployment Scripts Update

### Updated Backend Deployment Script

```powershell
# deploy-backend-production.ps1
Write-Host "🚀 Starting Backend Production Deployment..." -ForegroundColor Green

# 1. Install dependencies
Set-Location "Backend"
Write-Host "📦 Installing production dependencies..." -ForegroundColor Yellow
npm ci --only=production

# 2. Run security audit
Write-Host "🔒 Running security audit..." -ForegroundColor Yellow
npm audit --audit-level moderate

# 3. Create deployment package
Write-Host "📁 Creating deployment package..." -ForegroundColor Yellow
$excludeList = @(
    "node_modules/",
    ".git/",
    ".env.local",
    ".env.development",
    "*.log",
    "coverage/",
    ".nyc_output/",
    "tests/",
    "*.test.js"
)

$files = Get-ChildItem -Path "." -Recurse | Where-Object {
    $file = $_
    -not ($excludeList | Where-Object { $file.FullName -like "*$_*" })
}

Compress-Archive -Path $files -DestinationPath "../backend-production.zip" -Force

Write-Host "✅ Backend deployment package created: backend-production.zip" -ForegroundColor Green
Set-Location ".."
```

### Updated Frontend Deployment Script

```powershell
# deploy-frontend-production.ps1
Write-Host "🚀 Starting Frontend Production Deployment..." -ForegroundColor Green

Set-Location "frontend"

# 1. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci

# 2. Run tests (optional)
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
npm test -- --coverage --watchAll=false

# 3. Build for production
Write-Host "🏗️ Building for production..." -ForegroundColor Yellow
npm run build

# 4. Optimize images (if imagemin is installed)
Write-Host "🖼️ Optimizing images..." -ForegroundColor Yellow
# npx imagemin dist/assets/**/*.{jpg,png,gif} --out-dir=dist/assets/

# 5. Create deployment package
Write-Host "📁 Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path "dist/*" -DestinationPath "../frontend-production.zip" -Force

Write-Host "✅ Frontend deployment package created: frontend-production.zip" -ForegroundColor Green
Set-Location ".."
```

---

## 🔄 Continuous Deployment Strategy

### 1. Version Control

```bash
# Tag your releases
git tag -a v1.0.1 -m "Production release v1.0.1"
git push origin v1.0.1
```

### 2. Automated Backup Script

```powershell
# backup-production.ps1
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"

# Backup current production files via FTP/SFTP
Write-Host "📁 Creating backup: production-backup-$timestamp.zip" -ForegroundColor Yellow

# Your backup logic here
# Could use WinSCP, FileZilla CLI, or cPanel API
```

### 3. Rollback Strategy

Always keep previous version as backup:

- `/public_html/election-backup/` (previous version)
- `/public_html/backend-backup/` (previous version)

---

## 📈 Performance Monitoring

### 1. Client-side Analytics

Add to your React app:

```javascript
// utils/analytics.js
export const trackPageView = (page) => {
  if (window.gtag) {
    window.gtag("config", "GA_MEASUREMENT_ID", {
      page_path: page,
    });
  }
};

export const trackEvent = (action, category, label) => {
  if (window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
    });
  }
};
```

### 2. Server-side Monitoring

```javascript
// Add to your server.js
const morgan = require("morgan");

// Custom log format
morgan.token("real-ip", (req) => {
  return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
});

app.use(
  morgan(
    ":real-ip - :method :url :status :res[content-length] - :response-time ms"
  )
);
```

---

## 🎯 Quick Deployment Checklist

### Before Each Deployment:

- [ ] Test locally with production environment variables
- [ ] Run security audit (`npm audit`)
- [ ] Update version numbers
- [ ] Create git tag
- [ ] Backup current production
- [ ] Test database connections
- [ ] Verify SSL certificates
- [ ] Check domain/subdomain configurations

### After Each Deployment:

- [ ] Test all major functionalities
- [ ] Check API endpoints
- [ ] Verify routing works
- [ ] Test on mobile devices
- [ ] Monitor error logs for 24 hours
- [ ] Update documentation
- [ ] Notify team members

---

## 🆘 Troubleshooting Common Issues

### Backend Issues:

1. **Node.js app not starting**: Check Node.js version compatibility
2. **Database connection failed**: Verify MongoDB Atlas IP whitelist
3. **CORS errors**: Update CORS configuration
4. **High memory usage**: Implement connection pooling

### Frontend Issues:

1. **Blank page**: Check console for JavaScript errors
2. **API calls failing**: Verify API URL in environment variables
3. **Routing not working**: Check .htaccess configuration
4. **Slow loading**: Implement code splitting and lazy loading

### SSL/HTTPS Issues:

1. **Mixed content warnings**: Ensure all resources use HTTPS
2. **Certificate errors**: Renew SSL certificate in cPanel
3. **Redirect loops**: Check .htaccess redirect rules

---

## 📚 Additional Resources

- [cPanel Node.js Documentation](https://docs.cpanel.net/cpanel/software/node-js-selector/)
- [MongoDB Atlas Connection Guide](https://docs.atlas.mongodb.com/connect-to-cluster/)
- [React Production Deployment](https://create-react-app.dev/docs/deployment/)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practices-production.html)
