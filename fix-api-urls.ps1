# PowerShell script to fix API URL template literals
# This script replaces single quotes with backticks for template literals containing environment variables

$rootPath = "d:\ElectionAT\frontend\src"

# Function to recursively process files
function Process-Files {
    param(
        [string]$Path
    )
    
    Get-ChildItem -Path $Path -Recurse -Include "*.js", "*.jsx", "*.ts", "*.tsx" | ForEach-Object {
        $filePath = $_.FullName
        $content = Get-Content -Path $filePath -Raw
        
        if ($content -and $content.Contains('${import.meta.env.VITE_APP_API_URL}')) {
            Write-Host "Processing: $($_.Name)"
            
            # Replace single quotes with backticks for template literals containing environment variables
            $updatedContent = $content -replace "'(\$\{import\.meta\.env\.VITE_APP_API_URL\}[^']*)'", '`$1`'
            
            # Only write if content changed
            if ($updatedContent -ne $content) {
                Set-Content -Path $filePath -Value $updatedContent -NoNewline
                Write-Host "  - Fixed template literals in $($_.Name)"
            }
        }
    }
}

Write-Host "Starting API URL template literal fix..."
Process-Files -Path $rootPath
Write-Host "Completed API URL template literal fix!"
