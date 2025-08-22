# 🚀 Enhanced Backend Production Deployment Script
# For mbnmediaconsulting.in/backend

Write-Host "🚀 Starting Enhanced Backend Production Deployment..." -ForegroundColor Green
Write-Host "Target: https://mbnmediaconsulting.in/backend/" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "Backend")) {
    Write-Host "❌ Backend directory not found. Please run from project root." -ForegroundColor Red
    exit 1
}

Set-Location "Backend"

# 1. Environment validation
Write-Host "🔍 Validating environment..." -ForegroundColor Yellow

# Check Node.js version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Gray

# Check for required files
$requiredFiles = @("server.js", "package.json", ".env")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Required file missing: $file" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
}

# 2. Install production dependencies
Write-Host "📦 Installing production dependencies..." -ForegroundColor Yellow
npm ci --only=production --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# 3. Security audit
Write-Host "🔒 Running security audit..." -ForegroundColor Yellow
npm audit --audit-level moderate --quiet

# 4. Run tests (if test script exists)
if (Get-Content "package.json" | Select-String '"test"') {
    Write-Host "🧪 Running tests..." -ForegroundColor Yellow
    npm test -- --passWithNoTests --silent
}

# 5. Create optimized .env for production
Write-Host "⚙️ Creating production environment file..." -ForegroundColor Yellow

$envContent = @"
NODE_ENV=production
PORT=3000
MONGO_URI=your_production_mongodb_uri_here
JWT_SECRET=your_super_secure_jwt_secret_256_bits_here
JWT_EXPIRE=30d
CORS_ORIGIN=https://mbnmediaconsulting.in
API_BASE_URL=https://mbnmediaconsulting.in/backend
BASE_URL=https://mbnmediaconsulting.in
FRONTEND_URL=https://mbnmediaconsulting.in/election

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=error
LOG_FILE=./logs/app.log

# Database
DB_CONNECTION_TIMEOUT=5000
DB_SOCKET_TIMEOUT=45000
DB_MAX_POOL_SIZE=10
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8

# 6. Create deployment package with optimizations
Write-Host "📁 Creating optimized deployment package..." -ForegroundColor Yellow

# Files to include in deployment
$includeFiles = @(
    "*.js",
    "package.json",
    "package-lock.json",
    ".env.production",
    "config/",
    "controllers/",
    "middlewares/",
    "models/",
    "routes/",
    "utils/",
    "uploads/",
    "Data/"
)

# Files/directories to exclude
$excludePatterns = @(
    "node_modules/",
    ".git/",
    "*.log",
    "coverage/",
    ".nyc_output/",
    "tests/",
    "test/",
    "*.test.js",
    "*.spec.js",
    ".env.local",
    ".env.development",
    "*.md",
    ".gitignore",
    ".eslintrc*",
    ".prettierrc*",
    "nodemon.json"
)

# Create temporary directory for deployment files
$tempDir = "deployment-temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files excluding patterns
Get-ChildItem -Path "." -Recurse | Where-Object {
    $file = $_
    $include = $false
    
    # Check if file matches include patterns
    foreach ($pattern in $includeFiles) {
        if ($file.Name -like $pattern -or $file.FullName -like "*$($pattern.TrimEnd('/'))*") {
            $include = $true
            break
        }
    }
    
    # Exclude if matches exclude patterns
    if ($include) {
        foreach ($pattern in $excludePatterns) {
            if ($file.FullName -like "*$pattern*") {
                $include = $false
                break
            }
        }
    }
    
    return $include
} | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $destinationPath = Join-Path $tempDir $relativePath
    $destinationDir = Split-Path $destinationPath -Parent
    
    if (-not (Test-Path $destinationDir)) {
        New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    }
    
    Copy-Item $_.FullName $destinationPath -Force
}

# Create package.json for production
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.scripts = @{
    "start" = "node server.js"
}
$packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "$tempDir/package.json" -Encoding UTF8

# Create deployment archive
Compress-Archive -Path "$tempDir/*" -DestinationPath "../backend-production-enhanced.zip" -Force

# Cleanup
Remove-Item $tempDir -Recurse -Force

# 7. Create deployment instructions
$instructions = @"
🚀 BACKEND DEPLOYMENT INSTRUCTIONS
=================================

1. Upload 'backend-production-enhanced.zip' to your cPanel File Manager
2. Navigate to /public_html/ (or your domain's root)
3. Create/navigate to 'backend' folder
4. Extract the zip file
5. Update the .env.production file with your actual values:
   - MONGO_URI: Your MongoDB Atlas connection string
   - JWT_SECRET: Generate a secure 256-bit secret
   - Other environment variables as needed

6. In cPanel → Node.js App:
   - Application Root: backend
   - Application URL: /backend
   - Application Startup File: server.js
   - Node.js Version: 20.x (current: $nodeVersion)

7. Click 'Install Dependencies' or run: npm install --production

8. Start the application

9. Test: https://mbnmediaconsulting.in/backend/health

🔧 ENVIRONMENT VARIABLES TO UPDATE:
- MONGO_URI (Required)
- JWT_SECRET (Required - generate with: openssl rand -base64 32)
- CORS_ORIGIN (Already set to your domain)
- API_BASE_URL (Already set)

🛡️ SECURITY CHECKLIST:
- [ ] SSL/HTTPS enabled
- [ ] MongoDB IP whitelist updated
- [ ] Strong JWT secret generated
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] CORS properly set

📊 MONITORING:
- Health check: /backend/health
- API status: /backend/api/health
- Error logs: Check cPanel error logs

"@

$instructions | Out-File -FilePath "../DEPLOYMENT_INSTRUCTIONS.txt" -Encoding UTF8

Set-Location ".."

Write-Host "" -ForegroundColor Green
Write-Host "✅ Enhanced Backend Deployment Package Created!" -ForegroundColor Green
Write-Host "📦 File: backend-production-enhanced.zip" -ForegroundColor Cyan
Write-Host "📋 Instructions: DEPLOYMENT_INSTRUCTIONS.txt" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Upload the zip file to cPanel" -ForegroundColor White
Write-Host "2. Follow the deployment instructions" -ForegroundColor White
Write-Host "3. Update environment variables" -ForegroundColor White
Write-Host "4. Test the deployment" -ForegroundColor White
Write-Host "" -ForegroundColor Green
