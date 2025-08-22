param(
    [string]$BackendPath = "d:\ElectionAT\Backend\controllers"
)

Write-Host "Fixing model imports in $BackendPath" -ForegroundColor Green

# Get all JavaScript files in controllers directory
$jsFiles = Get-ChildItem -Path $BackendPath -Filter "*.js" -File

$fixedCount = 0
$totalFiles = $jsFiles.Count

foreach ($file in $jsFiles) {
    $filePath = $file.FullName
    $fileName = $file.Name
    
    try {
        # Read file content
        $content = Get-Content -Path $filePath -Raw -ErrorAction Stop
        $originalContent = $content
        
        # Replace problematic imports
        $content = $content -replace "require\('\.\./models/assembly'\)", "require('../models/Assembly')"
        $content = $content -replace "require\('\.\./models/parliament'\)", "require('../models/Parliament')"
        $content = $content -replace "require\('\.\./models/division'\)", "require('../models/Division')"
        $content = $content -replace "require\('\.\./models/district'\)", "require('../models/District')"
        
        # Check if any changes were made
        if ($content -ne $originalContent) {
            Write-Host "Fixing: $fileName" -ForegroundColor Yellow
            
            # Write back to file
            Set-Content -Path $filePath -Value $content -NoNewline -ErrorAction Stop
            $fixedCount++
        }
    }
    catch {
        Write-Warning "Error processing $fileName : $($_.Exception.Message)"
    }
}

Write-Host "Completed! Fixed $fixedCount out of $totalFiles files." -ForegroundColor Green

# Verify the changes
Write-Host "`nVerifying fixes..." -ForegroundColor Cyan
$remainingIssues = @()

foreach ($file in $jsFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $issues = @()
    
    if ($content -match "require\('\.\./models/assembly'\)") { $issues += "assembly" }
    if ($content -match "require\('\.\./models/parliament'\)") { $issues += "parliament" }
    if ($content -match "require\('\.\./models/division'\)") { $issues += "division" }
    if ($content -match "require\('\.\./models/district'\)") { $issues += "district" }
    
    if ($issues.Count -gt 0) {
        $remainingIssues += "$($file.Name): $($issues -join ', ')"
    }
}

if ($remainingIssues.Count -eq 0) {
    Write-Host "All model imports have been fixed!" -ForegroundColor Green
} else {
    Write-Warning "Files still with issues:"
    $remainingIssues | ForEach-Object { Write-Warning "  $_" }
}
