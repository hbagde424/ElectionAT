param(
    [string]$BackendPath = "d:\ElectionAT\Backend\controllers"
)

Write-Host "Fixing division model imports in $BackendPath"

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
        
        # Check if file contains the problematic import
        if ($content -match "require\('\.\./models/division'\)") {
            Write-Host "Fixing: $fileName"
            
            # Replace the import
            $newContent = $content -replace "require\('\.\./models/division'\)", "require('../models/Division')"
            
            # Write back to file
            Set-Content -Path $filePath -Value $newContent -NoNewline -ErrorAction Stop
            $fixedCount++
        }
    }
    catch {
        Write-Warning "Error processing $fileName : $($_.Exception.Message)"
    }
}

Write-Host "Completed! Fixed $fixedCount out of $totalFiles files."

# Verify the changes
Write-Host "`nVerifying fixes..."
$remainingIssues = 0

foreach ($file in $jsFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match "require\('\.\./models/division'\)") {
        Write-Warning "Still has issue: $($file.Name)"
        $remainingIssues++
    }
}

if ($remainingIssues -eq 0) {
    Write-Host "All division imports have been fixed!" -ForegroundColor Green
} else {
    Write-Warning "$remainingIssues files still have issues"
}
