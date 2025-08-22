# Simple Backend Deployment Script
Write-Host "🚀 Preparing Backend for Production..." -ForegroundColor Green

# Change to backend directory
Set-Location "Backend"

# Install production dependencies
Write-Host "📦 Installing production dependencies..." -ForegroundColor Yellow
npm install --production

# Create deployment package
Write-Host "📁 Creating deployment package..." -ForegroundColor Yellow

# Files to include
$includeFiles = @(
    "*.js",
    "package.json",
    "package-lock.json",
    ".env",
    "config/*",
    "controllers/*",
    "middlewares/*",
    "models/*",
    "routes/*",
    "utils/*",
    "uploads/*",
    "Data/*"
)

# Create temp directory
$tempDir = "temp-deploy"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files
Copy-Item "*.js" $tempDir -Force
Copy-Item "package.json" $tempDir -Force
Copy-Item "package-lock.json" $tempDir -Force
Copy-Item ".env" $tempDir -Force

# Copy directories
$dirs = @("config", "controllers", "middlewares", "models", "routes", "utils", "uploads", "Data")
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Copy-Item $dir $tempDir -Recurse -Force
    }
}

# Create zip
Compress-Archive -Path "$tempDir/*" -DestinationPath "../backend-production.zip" -Force

# Cleanup
Remove-Item $tempDir -Recurse -Force

Set-Location ".."

Write-Host "✅ Backend deployment package created: backend-production.zip" -ForegroundColor Green
Write-Host "📋 Upload this to /public_html/backend/ in cPanel" -ForegroundColor Cyan
