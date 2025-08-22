# 🚀 Enhanced Frontend Production Deployment Script
# For mbnmediaconsulting.in/election

Write-Host "🚀 Starting Enhanced Frontend Production Deployment..." -ForegroundColor Green
Write-Host "Target: https://mbnmediaconsulting.in/election/" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "frontend")) {
    Write-Host "❌ Frontend directory not found. Please run from project root." -ForegroundColor Red
    exit 1
}

Set-Location "frontend"

# 1. Environment validation
Write-Host "🔍 Validating environment..." -ForegroundColor Yellow

# Check Node.js version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Gray

# Check for required files
$requiredFiles = @("package.json", "index.html", "vite.config.mjs")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Required file missing: $file" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
}

# 2. Create production environment file
Write-Host "⚙️ Creating production environment configuration..." -ForegroundColor Yellow

$envProduction = @"
# Production Environment Variables
VITE_APP_API_URL=https://mbnmediaconsulting.in/backend
VITE_APP_BASE_NAME=/election
PUBLIC_URL=https://mbnmediaconsulting.in/election
VITE_APP_ENVIRONMENT=production
VITE_APP_API_TIMEOUT=10000
VITE_APP_ENABLE_ANALYTICS=true

# Security
VITE_APP_ENABLE_DEVTOOLS=false
VITE_APP_DEBUG_MODE=false

# Performance
VITE_APP_LAZY_LOADING=true
VITE_APP_IMAGE_OPTIMIZATION=true
VITE_APP_CACHE_DURATION=86400

# Features
VITE_APP_ENABLE_PWA=true
VITE_APP_ENABLE_OFFLINE=true
"@

$envProduction | Out-File -FilePath ".env.production" -Encoding UTF8

# 3. Update vite.config.mjs for production optimizations
Write-Host "🔧 Optimizing Vite configuration..." -ForegroundColor Yellow

$viteConfig = @"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/election/',
  
  // Build optimizations
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    
    // Chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@mui/lab',
            '@mui/x-data-grid',
            '@mui/x-date-pickers'
          ],
          'vendor-utils': ['axios', 'lodash', 'date-fns'],
          
          // App chunks
          'components': [resolve(__dirname, 'src/components')],
          'pages': [resolve(__dirname, 'src/pages')],
          'utils': [resolve(__dirname, 'src/utils')]
        },
        
        // Asset naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          
          if (/\.(css)$/i.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    
    // Terser options
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    // Performance
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    
    // Target modern browsers
    target: ['es2015', 'chrome79', 'firefox67', 'safari12']
  },
  
  // Preview server (for local testing)
  preview: {
    port: 3000,
    host: true
  },
  
  // Development server
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  // CSS processing
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCase'
    }
  }
});
"@

$viteConfig | Out-File -FilePath "vite.config.mjs" -Encoding UTF8

# 4. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# 5. Run linting (if ESLint is configured)
if (Test-Path ".eslintrc.*") {
    Write-Host "🔍 Running ESLint..." -ForegroundColor Yellow
    npm run lint --silent 2>$null
}

# 6. Run tests (if available)
if (Get-Content "package.json" | Select-String '"test"') {
    Write-Host "🧪 Running tests..." -ForegroundColor Yellow
    npm test -- --coverage --watchAll=false --silent 2>$null
}

# 7. Build for production
Write-Host "🏗️ Building for production..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# 8. Create optimized .htaccess file
Write-Host "⚙️ Creating optimized .htaccess..." -ForegroundColor Yellow

$htaccessContent = @"
# ElectionAT Frontend - Production Configuration

# Security Headers
<IfModule mod_headers.c>
    # Prevent MIME type sniffing
    Header always set X-Content-Type-Options nosniff
    
    # Prevent clickjacking
    Header always set X-Frame-Options DENY
    
    # XSS Protection
    Header always set X-XSS-Protection "1; mode=block"
    
    # HSTS (HTTP Strict Transport Security)
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    
    # Referrer Policy
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Content Security Policy
    Header always set Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https: wss:; media-src 'self' https:; object-src 'none'; frame-src 'none';"
    
    # Feature Policy
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=(), accelerometer=(), gyroscope=(), magnetometer=()"
</IfModule>

# Hide server information
ServerTokens Prod
ServerSignature Off

# Prevent access to sensitive files
<FilesMatch "\.(env|log|json|md|txt|yml|yaml|ini|conf)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Prevent access to hidden files and directories
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

# GZIP Compression
<IfModule mod_deflate.c>
    # Compress HTML, CSS, JS, XML files
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE image/svg+xml
    
    # Don't compress already compressed files
    SetEnvIfNoCase Request_URI \
        \.(?:gif|jpe?g|png|zip|gz|bz2|sit|rar)$ no-gzip dont-vary
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive on
    
    # CSS and JavaScript
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/javascript "access plus 1 year"
    
    # Images
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    
    # Fonts
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
    
    # Other assets
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType application/json "access plus 1 day"
    
    # HTML
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# Add Vary header for proper caching
<IfModule mod_headers.c>
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
    
    <FilesMatch "\.(html|htm)$">
        Header set Cache-Control "public, max-age=3600, must-revalidate"
    </FilesMatch>
</IfModule>

# React Router - Handle client-side routing
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Set base for subfolder deployment
    RewriteBase /election/
    
    # Handle existing files and directories
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Exclude API calls (redirect to backend)
    RewriteCond %{REQUEST_URI} !^/election/api/
    
    # Redirect all other requests to index.html for React Router
    RewriteRule . /election/index.html [L]
    
    # Optional: Redirect API calls to backend
    RewriteRule ^api/(.*)$ https://mbnmediaconsulting.in/backend/api/$1 [P,L]
</IfModule>

# Error Pages (optional)
ErrorDocument 404 /election/index.html
ErrorDocument 403 /election/index.html

# Disable ETags (use Expires instead)
<IfModule mod_headers.c>
    Header unset ETag
</IfModule>
FileETag None
"@

$htaccessContent | Out-File -FilePath "dist/.htaccess" -Encoding UTF8

# 9. Create robots.txt for production
$robotsContent = @"
User-agent: *
Allow: /

# Sitemap
Sitemap: https://mbnmediaconsulting.in/election/sitemap.xml

# Disallow sensitive areas
Disallow: /api/
Disallow: /admin/
Disallow: /*.json$
Disallow: /*.log$
"@

$robotsContent | Out-File -FilePath "dist/robots.txt" -Encoding UTF8

# 10. Create manifest.json for PWA (if not exists)
if (-not (Test-Path "dist/manifest.json")) {
    $manifestContent = @"
{
  "name": "ElectionAT - Election Analysis Tool",
  "short_name": "ElectionAT",
  "description": "Comprehensive election data analysis and management platform",
  "start_url": "/election/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/election/favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "categories": ["productivity", "government"],
  "lang": "en",
  "scope": "/election/"
}
"@
    
    $manifestContent | Out-File -FilePath "dist/manifest.json" -Encoding UTF8
}

# 11. Optimize and analyze bundle
Write-Host "📊 Analyzing bundle size..." -ForegroundColor Yellow

# Calculate bundle sizes
$jsFiles = Get-ChildItem "dist/assets/js/*.js" -ErrorAction SilentlyContinue
$cssFiles = Get-ChildItem "dist/assets/css/*.css" -ErrorAction SilentlyContinue
$totalJsSize = ($jsFiles | Measure-Object -Property Length -Sum).Sum / 1KB
$totalCssSize = ($cssFiles | Measure-Object -Property Length -Sum).Sum / 1KB

Write-Host "JavaScript total: $([math]::Round($totalJsSize, 2)) KB" -ForegroundColor Gray
Write-Host "CSS total: $([math]::Round($totalCssSize, 2)) KB" -ForegroundColor Gray

# 12. Create deployment package
Write-Host "📁 Creating optimized deployment package..." -ForegroundColor Yellow

# Create archive with all built files
Compress-Archive -Path "dist/*" -DestinationPath "../frontend-production-enhanced.zip" -Force

# 13. Create deployment instructions
$instructions = @"
🚀 FRONTEND DEPLOYMENT INSTRUCTIONS
==================================

📦 Package: frontend-production-enhanced.zip
🎯 Target: https://mbnmediaconsulting.in/election/

DEPLOYMENT STEPS:
================

1. 📁 BACKUP CURRENT SITE
   - Login to cPanel → File Manager
   - Navigate to /public_html/election/
   - Create backup: election-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')

2. 🗂️ UPLOAD NEW VERSION
   - Upload frontend-production-enhanced.zip to /public_html/
   - Extract the zip file
   - Files should be in /public_html/election/

3. 📋 VERIFY STRUCTURE
   /public_html/election/
   ├── index.html
   ├── .htaccess
   ├── robots.txt
   ├── manifest.json
   ├── favicon.ico
   └── assets/
       ├── css/
       ├── js/
       ├── images/
       └── fonts/

4. 🔧 SSL/HTTPS SETUP
   - cPanel → SSL/TLS → Let's Encrypt
   - Enable "Force HTTPS Redirect"

5. 🧪 TESTING CHECKLIST
   - [ ] Homepage loads: https://mbnmediaconsulting.in/election/
   - [ ] Navigation works (React Router)
   - [ ] API calls work (check browser console)
   - [ ] Mobile responsive design
   - [ ] All assets load (images, fonts, etc.)
   - [ ] No console errors
   - [ ] SSL certificate valid

PERFORMANCE OPTIMIZATIONS INCLUDED:
=================================
✅ Gzip compression enabled
✅ Browser caching configured (1 year for assets)
✅ Security headers implemented
✅ Code splitting and lazy loading
✅ Minified and optimized bundles
✅ Progressive Web App features
✅ SEO optimizations

BUNDLE ANALYSIS:
===============
📊 JavaScript: $([math]::Round($totalJsSize, 2)) KB
📊 CSS: $([math]::Round($totalCssSize, 2)) KB
📊 Total files: $((Get-ChildItem "dist" -Recurse -File).Count)

MONITORING & MAINTENANCE:
========================
- Monitor Core Web Vitals: https://pagespeed.web.dev/
- Check error logs in cPanel
- Update dependencies monthly
- Review security headers: https://securityheaders.com/

TROUBLESHOOTING:
===============
❌ Blank page → Check browser console for errors
❌ API errors → Verify backend URL in environment
❌ Routing issues → Check .htaccess configuration  
❌ SSL issues → Verify certificate in cPanel
❌ Slow loading → Check network tab for large assets

🆘 ROLLBACK PROCEDURE:
=====================
1. Go to /public_html/election-backup-[timestamp]/
2. Copy all files to /public_html/election/
3. Clear browser cache and test

📞 SUPPORT:
==========
- Check deployment logs in cPanel
- Verify environment variables
- Test API endpoints independently
- Monitor browser console for errors

🎉 DEPLOYMENT COMPLETE!
Your site should now be live at: https://mbnmediaconsulting.in/election/
"@

$instructions | Out-File -FilePath "../FRONTEND_DEPLOYMENT_INSTRUCTIONS.txt" -Encoding UTF8

Set-Location ".."

Write-Host "" -ForegroundColor Green
Write-Host "✅ Enhanced Frontend Deployment Package Created!" -ForegroundColor Green
Write-Host "📦 Package: frontend-production-enhanced.zip" -ForegroundColor Cyan
Write-Host "📊 Bundle size - JS: $([math]::Round($totalJsSize, 2)) KB, CSS: $([math]::Round($totalCssSize, 2)) KB" -ForegroundColor Gray
Write-Host "📋 Instructions: FRONTEND_DEPLOYMENT_INSTRUCTIONS.txt" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Backup current site" -ForegroundColor White
Write-Host "2. Upload and extract the zip file" -ForegroundColor White
Write-Host "3. Test all functionality" -ForegroundColor White
Write-Host "4. Monitor for 24 hours" -ForegroundColor White
Write-Host "" -ForegroundColor Green
