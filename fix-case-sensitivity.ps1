# PowerShell script to fix all case sensitivity issues in controller files

Write-Host "🔧 Fixing all model import case sensitivity issues..." -ForegroundColor Green

$controllersPath = "d:\ElectionAT\Backend\controllers"
$fixCount = 0

# Define the replacements needed
$replacements = @{
    "require\('\.\./models/assembly'\)" = "require('../models/Assembly')"
    "require\('\.\./models/parliament'\)" = "require('../models/Parliament')"
    "require\('\.\./models/division'\)" = "require('../models/Division')"
    "require\('\.\./models/district'\)" = "require('../models/District')"
}

# Get all JavaScript files
$jsFiles = Get-ChildItem -Path $controllersPath -Filter "*.js"

foreach ($file in $jsFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    $changed = $false
    
    # Apply each replacement
    foreach ($pattern in $replacements.Keys) {
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacements[$pattern]
            $changed = $true
        }
    }
    
    # Save if changed
    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Fixed: $($file.Name)" -ForegroundColor Yellow
        $fixCount++
    }
}

Write-Host "🎉 Completed! Fixed $fixCount files." -ForegroundColor Green

# Final verification
Write-Host "`n🔍 Verifying fixes..." -ForegroundColor Cyan
$issuesFound = $false

foreach ($file in $jsFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    $patterns = @(
        "require\('\.\./models/assembly'\)",
        "require\('\.\./models/parliament'\)",
        "require\('\.\./models/division'\)",
        "require\('\.\./models/district'\)"
    )
    
    foreach ($pattern in $patterns) {
        if ($content -match $pattern) {
            Write-Warning "❌ Still has issues: $($file.Name) - $pattern"
            $issuesFound = $true
        }
    }
}

if (-not $issuesFound) {
    Write-Host "✨ All case sensitivity issues have been resolved!" -ForegroundColor Green
}
