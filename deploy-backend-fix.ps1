# Comprehensive Backend Deployment Script
Write-Host "🚀 Creating Backend Deployment Package..." -ForegroundColor Green

$BackendPath = "d:\ElectionAT\Backend"
$DeploymentZip = "d:\ElectionAT\backend-fixed-complete.zip"

# Remove old deployment package if exists
if (Test-Path $DeploymentZip) {
    Remove-Item $DeploymentZip -Force
    Write-Host "Removed old deployment package" -ForegroundColor Yellow
}

# Change to backend directory
Set-Location $BackendPath

Write-Host "📁 Verifying critical files..." -ForegroundColor Cyan

# Critical files to verify
$criticalFiles = @(
    "config\candidateUpload.js",
    "config\config.js", 
    "config\db.js",
    "controllers\candidateController.js",
    "routes\candidateRoutes.js",
    "app.js",
    "server.js",
    "package.json"
)

$missingFiles = @()
foreach ($file in $criticalFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    } else {
        Write-Host "✅ $file" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing critical files:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow

# Files and directories to include
$includePatterns = @(
    "*.js",
    "package.json",
    "package-lock.json",
    ".env",
    "config\*",
    "controllers\*", 
    "routes\*",
    "models\*",
    "middlewares\*",
    "utils\*",
    "uploads\*"
)

# Create temporary staging directory
$stagingDir = "deployment-staging"
if (Test-Path $stagingDir) {
    Remove-Item $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir | Out-Null

# Copy files
foreach ($pattern in $includePatterns) {
    $items = Get-ChildItem -Path $pattern -Recurse -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        if ($item.PSIsContainer) {
            # Create directory structure
            $relativePath = $item.FullName.Replace($PWD.Path + "\", "")
            $targetDir = Join-Path $stagingDir $relativePath
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
        } else {
            # Copy file
            $relativePath = $item.FullName.Replace($PWD.Path + "\", "")
            $targetPath = Join-Path $stagingDir $relativePath
            $targetDir = Split-Path $targetPath -Parent
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            Copy-Item $item.FullName $targetPath -Force
        }
    }
}

# Verify critical files in staging
Write-Host "🔍 Verifying staging directory..." -ForegroundColor Cyan
$stagingIssues = @()
foreach ($file in $criticalFiles) {
    $stagingFile = Join-Path $stagingDir $file
    if (-not (Test-Path $stagingFile)) {
        $stagingIssues += $file
    } else {
        Write-Host "✅ Staged: $file" -ForegroundColor Green
    }
}

if ($stagingIssues.Count -gt 0) {
    Write-Host "❌ Missing files in staging:" -ForegroundColor Red
    $stagingIssues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

# Create ZIP package
Write-Host "📦 Creating ZIP package..." -ForegroundColor Yellow
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($stagingDir, $DeploymentZip)
    Write-Host "✅ Created: $DeploymentZip" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create ZIP: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Cleanup staging
Remove-Item $stagingDir -Recurse -Force

# Show package info
$zipSize = (Get-Item $DeploymentZip).Length / 1MB
Write-Host "📊 Package size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan

Write-Host "`n🎉 Deployment package created successfully!" -ForegroundColor Green
Write-Host "📁 Location: $DeploymentZip" -ForegroundColor Cyan
Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload $DeploymentZip to your server" -ForegroundColor White
Write-Host "2. Extract it to replace your backend directory" -ForegroundColor White
Write-Host "3. Run 'npm install' on the server" -ForegroundColor White
Write-Host "4. Restart your server" -ForegroundColor White
