# Quick Backend Deployment Fix Script
Write-Host "🔧 Backend Deployment Fix for candidateUpload Issue" -ForegroundColor Green

# Change to backend directory
Set-Location "Backend"

# Check critical files
$criticalFiles = @(
    "config/candidateUpload.js",
    "config/config.js", 
    "config/db.js",
    "controllers/candidateController.js",
    "routes/candidateRoutes.js"
)

Write-Host "📋 Checking critical files..." -ForegroundColor Yellow
$missingFiles = @()

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "⚠️ Missing files found. Cannot proceed with deployment." -ForegroundColor Red
    Write-Host "Missing files:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

# Check if multer is in package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.dependencies.multer) {
    Write-Host "✅ multer dependency found in package.json" -ForegroundColor Green
} else {
    Write-Host "❌ multer dependency missing from package.json" -ForegroundColor Red
}

# Create deployment zip with all necessary files
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipName = "backend-deployment-$timestamp.zip"

# Define files and folders to include
$includeItems = @(
    "*.js",
    "package.json", 
    "package-lock.json",
    ".env",
    ".env.production",
    "config",
    "controllers", 
    "middlewares",
    "models",
    "routes",
    "utils",
    "uploads",
    "Data"
)

# Create temporary directory
$tempDir = "temp_deployment"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files
foreach ($item in $includeItems) {
    if (Test-Path $item) {
        Write-Host "📁 Including: $item" -ForegroundColor Gray
        Copy-Item $item $tempDir -Recurse -Force
    }
}

# Create zip file
Compress-Archive -Path "$tempDir\*" -DestinationPath "..\$zipName" -Force

# Cleanup
Remove-Item $tempDir -Recurse -Force

Write-Host "✅ Deployment package created: $zipName" -ForegroundColor Green
Write-Host "📤 Upload this file to your server and extract it in the backend directory" -ForegroundColor Cyan

# Go back to parent directory  
Set-Location ".."

Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload $zipName to your server" -ForegroundColor White
Write-Host "2. Extract it in your backend directory" -ForegroundColor White  
Write-Host "3. Run 'npm install' on the server" -ForegroundColor White
Write-Host "4. Restart your server" -ForegroundColor White
