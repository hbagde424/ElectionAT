# Verification script to check if API URL fixes are working
$frontendPath = "d:\ElectionAT\frontend\src"

Write-Host "Verifying API URL template literal fixes..." -ForegroundColor Green

# Check a few specific files that should have been fixed
$testFiles = @(
    "$frontendPath\pages\curd\booth\booth.jsx",
    "$frontendPath\pages\curd\user\user.jsx",
    "$frontendPath\pages\curd\state\state.jsx"
)

$totalIssues = 0

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        $content = Get-Content -Path $file -Raw
        
        # Check for incorrect single quote template literals
        $badPatterns = @()
        if ($content -match "'[^']*\$\{import\.meta\.env\.VITE_APP_API_URL\}[^']*'") {
            $badPatterns += "Single quotes with template literals"
        }
        
        # Check for correct backtick template literals
        $goodMatches = [regex]::Matches($content, '`[^`]*\$\{import\.meta\.env\.VITE_APP_API_URL\}[^`]*`')
        
        Write-Host "File: $($file.Split('\')[-1])" -ForegroundColor Yellow
        Write-Host "  Correct template literals: $($goodMatches.Count)" -ForegroundColor Green
        
        if ($badPatterns.Count -gt 0) {
            Write-Host "  Issues found: $($badPatterns -join ', ')" -ForegroundColor Red
            $totalIssues += $badPatterns.Count
        } else {
            Write-Host "  No issues found" -ForegroundColor Green
        }
        Write-Host ""
    }
}

# Summary
Write-Host "Summary:" -ForegroundColor Cyan
if ($totalIssues -eq 0) {
    Write-Host "✓ All template literals are correctly using backticks!" -ForegroundColor Green
    Write-Host "✓ API URL environment variable interpolation should work correctly" -ForegroundColor Green
} else {
    Write-Host "✗ Found $totalIssues issues that need fixing" -ForegroundColor Red
}

# Show environment configuration
Write-Host "`nEnvironment Configuration:" -ForegroundColor Cyan
$envFiles = @(
    "d:\ElectionAT\frontend\.env.development",
    "d:\ElectionAT\frontend\.env"
)

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "File: $($envFile.Split('\')[-1])" -ForegroundColor Yellow
        $envContent = Get-Content -Path $envFile
        $apiUrlLine = $envContent | Where-Object { $_ -match "VITE_APP_API_URL" }
        if ($apiUrlLine) {
            Write-Host "  $apiUrlLine" -ForegroundColor Green
        }
    }
}
