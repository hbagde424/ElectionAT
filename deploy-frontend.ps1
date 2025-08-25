# Frontend Build and Deployment Script for cPanel (Windows)

Write-Host "🚀 Starting frontend build for production..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location -Path "frontend"

# Install dependencies (if needed)
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build for production
Write-Host "🏗️ Building React app for production..." -ForegroundColor Yellow
npm run build

# Ensure .htaccess is properly configured for SPA routing
Write-Host "🔧 Verifying .htaccess configuration..." -ForegroundColor Yellow
$htaccessPath = "dist\.htaccess"
if (Test-Path $htaccessPath) {
    Write-Host "✅ .htaccess file found in dist folder" -ForegroundColor Green
} else {
    Write-Host "⚠️ .htaccess file not found in dist! Copying from public folder..." -ForegroundColor Yellow
    Copy-Item "public\.htaccess" "dist\.htaccess" -Force
    Write-Host "✅ .htaccess file copied to dist folder" -ForegroundColor Green
}

Write-Host "✅ Build completed! Files are ready in the 'dist' directory." -ForegroundColor Green
Write-Host ""
Write-Host "📁 Next steps for cPanel deployment:" -ForegroundColor Cyan
Write-Host "1. Compress the 'dist' folder contents" -ForegroundColor White
Write-Host "2. Upload to your cPanel File Manager" -ForegroundColor White
Write-Host "3. Extract in /public_html/election/ directory" -ForegroundColor White
Write-Host "4. Ensure .htaccess file is present for SPA routing" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Remember to update VITE_APP_API_URL in .env.production to your domain!" -ForegroundColor Magenta

# Create a zip file for easy upload
Write-Host "📦 Creating deployment zip file..." -ForegroundColor Yellow
Set-Location -Path "dist"
Compress-Archive -Path * -DestinationPath "../frontend-deployment.zip" -Force
Set-Location -Path ".."
Write-Host "✅ Created frontend-deployment.zip for easy upload to cPanel" -ForegroundColor Green

# Return to parent directory
Set-Location -Path ".."
