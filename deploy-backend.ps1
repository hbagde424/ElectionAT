# Backend Deployment Script for cPanel (Windows)

Write-Host "🚀 Preparing backend for cPanel deployment..." -ForegroundColor Green

# Navigate to backend directory
Set-Location -Path "Backend"

# Create production build (remove dev dependencies)
Write-Host "📦 Installing production dependencies only..." -ForegroundColor Yellow
npm install --production

# Create deployment package
Write-Host "📦 Creating backend deployment package..." -ForegroundColor Yellow

# Create a temporary deployment folder
$deploymentFolder = "backend-deployment"
if (Test-Path $deploymentFolder) {
    Remove-Item -Recurse -Force $deploymentFolder
}
New-Item -ItemType Directory -Path $deploymentFolder

# Copy necessary files
Copy-Item -Path "*.js" -Destination $deploymentFolder -Recurse
Copy-Item -Path "package.json" -Destination $deploymentFolder
Copy-Item -Path "config" -Destination $deploymentFolder -Recurse
Copy-Item -Path "controllers" -Destination $deploymentFolder -Recurse
Copy-Item -Path "models" -Destination $deploymentFolder -Recurse
Copy-Item -Path "routes" -Destination $deploymentFolder -Recurse
Copy-Item -Path "middlewares" -Destination $deploymentFolder -Recurse
Copy-Item -Path "utils" -Destination $deploymentFolder -Recurse

# Copy environment file template
Copy-Item -Path ".env.production" -Destination "$deploymentFolder\.env"

# Create zip file
Write-Host "🗜️ Creating backend-deployment.zip..." -ForegroundColor Yellow
Compress-Archive -Path "$deploymentFolder\*" -DestinationPath "backend-deployment.zip" -Force

# Cleanup
Remove-Item -Recurse -Force $deploymentFolder

Write-Host "✅ Backend deployment package created!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Next steps for cPanel deployment:" -ForegroundColor Cyan
Write-Host "1. Upload backend-deployment.zip to cPanel File Manager" -ForegroundColor White
Write-Host "2. Extract to /public_html/api/ or /public_html/backend/" -ForegroundColor White
Write-Host "3. Update .env file with production values" -ForegroundColor White
Write-Host "4. Setup Node.js app in cPanel" -ForegroundColor White
Write-Host "5. Run 'npm install' in cPanel Node.js interface" -ForegroundColor White

# Return to parent directory
Set-Location -Path ".."
