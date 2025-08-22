# Simple Frontend Deployment Script
Write-Host "🚀 Building Frontend for Production..." -ForegroundColor Green

# Change to frontend directory
Set-Location "frontend"

# Install dependencies (if needed)
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build for production
Write-Host "🏗️ Building for production..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Create deployment zip
Write-Host "📁 Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path "dist/*" -DestinationPath "../frontend-production.zip" -Force

Set-Location ".."

Write-Host "✅ Frontend deployment package created: frontend-production.zip" -ForegroundColor Green
Write-Host "📋 Upload this to /public_html/election/ in cPanel" -ForegroundColor Cyan
