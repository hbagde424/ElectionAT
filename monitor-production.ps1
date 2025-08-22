# 🔍 Production Monitoring & Health Check Script
# For mbnmediaconsulting.in deployment

Write-Host "🔍 ElectionAT Production Health Check" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Configuration
$frontendUrl = "https://mbnmediaconsulting.in/election/"
$backendUrl = "https://mbnmediaconsulting.in/backend/"
$apiHealthUrl = "https://mbnmediaconsulting.in/backend/health"

Write-Host "🌐 Target URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: $frontendUrl" -ForegroundColor Gray
Write-Host "  Backend: $backendUrl" -ForegroundColor Gray
Write-Host "  Health: $apiHealthUrl" -ForegroundColor Gray
Write-Host ""

# Function to test URL
function Test-Url {
    param(
        [string]$Url,
        [string]$Name,
        [int]$TimeoutSeconds = 30
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds -UseBasicParsing
        $statusCode = $response.StatusCode
        $responseTime = (Measure-Command { 
            Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds -UseBasicParsing 
        }).TotalMilliseconds
        
        if ($statusCode -eq 200) {
            Write-Host "✅ $Name" -ForegroundColor Green -NoNewline
            Write-Host " ($statusCode) - $([math]::Round($responseTime, 0))ms" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "⚠️ $Name" -ForegroundColor Yellow -NoNewline
            Write-Host " ($statusCode) - $([math]::Round($responseTime, 0))ms" -ForegroundColor Gray
            return $false
        }
    }
    catch {
        Write-Host "❌ $Name" -ForegroundColor Red -NoNewline
        Write-Host " (Failed) - $($_.Exception.Message)" -ForegroundColor Gray
        return $false
    }
}

# Function to check SSL certificate
function Test-SSL {
    param([string]$Url)
    
    try {
        $uri = [System.Uri]$Url
        $request = [System.Net.WebRequest]::Create($uri)
        $request.Method = "HEAD"
        $request.Timeout = 10000
        
        $response = $request.GetResponse()
        $cert = $request.ServicePoint.Certificate
        
        if ($cert) {
            $expiryDate = [DateTime]::Parse($cert.GetExpirationDateString())
            $daysUntilExpiry = ($expiryDate - [DateTime]::Now).Days
            
            if ($daysUntilExpiry -gt 30) {
                Write-Host "✅ SSL Certificate valid" -ForegroundColor Green -NoNewline
                Write-Host " (expires in $daysUntilExpiry days)" -ForegroundColor Gray
                return $true
            } elseif ($daysUntilExpiry -gt 0) {
                Write-Host "⚠️ SSL Certificate expires soon" -ForegroundColor Yellow -NoNewline
                Write-Host " ($daysUntilExpiry days)" -ForegroundColor Gray
                return $true
            } else {
                Write-Host "❌ SSL Certificate expired" -ForegroundColor Red
                return $false
            }
        }
    }
    catch {
        Write-Host "❌ SSL Check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check API health
function Test-ApiHealth {
    param([string]$Url)
    
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec 15
        
        if ($response.status -eq "OK") {
            Write-Host "✅ API Health Check" -ForegroundColor Green -NoNewline
            Write-Host " (Status: OK)" -ForegroundColor Gray
            
            if ($response.environment) {
                Write-Host "   Environment: $($response.environment)" -ForegroundColor Gray
            }
            if ($response.version) {
                Write-Host "   Version: $($response.version)" -ForegroundColor Gray
            }
            if ($response.uptime) {
                $uptimeHours = [math]::Round($response.uptime / 3600, 1)
                Write-Host "   Uptime: $uptimeHours hours" -ForegroundColor Gray
            }
            
            return $true
        } else {
            Write-Host "⚠️ API Health Check" -ForegroundColor Yellow -NoNewline
            Write-Host " (Status: $($response.status))" -ForegroundColor Gray
            return $false
        }
    }
    catch {
        Write-Host "❌ API Health Check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check page content
function Test-PageContent {
    param(
        [string]$Url,
        [string]$ExpectedContent,
        [string]$Name
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 30 -UseBasicParsing
        $content = $response.Content
        
        if ($content -like "*$ExpectedContent*") {
            Write-Host "✅ $Name content check" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ $Name content missing expected text" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "❌ $Name content check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check security headers
function Test-SecurityHeaders {
    param([string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 15 -UseBasicParsing
        $headers = $response.Headers
        
        $securityHeaders = @{
            "X-Content-Type-Options" = "nosniff"
            "X-Frame-Options" = "DENY"
            "X-XSS-Protection" = "1"
            "Strict-Transport-Security" = ""
        }
        
        $headerResults = @()
        foreach ($header in $securityHeaders.GetEnumerator()) {
            if ($headers.ContainsKey($header.Key)) {
                $headerResults += "✅ $($header.Key)"
            } else {
                $headerResults += "❌ $($header.Key) missing"
            }
        }
        
        Write-Host "🛡️ Security Headers:" -ForegroundColor Cyan
        foreach ($result in $headerResults) {
            if ($result.StartsWith("✅")) {
                Write-Host "   $result" -ForegroundColor Green
            } else {
                Write-Host "   $result" -ForegroundColor Red
            }
        }
        
        return $headerResults -notlike "❌*"
    }
    catch {
        Write-Host "❌ Security headers check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Start health checks
Write-Host "🔍 Starting Health Checks..." -ForegroundColor Yellow
Write-Host ""

# 1. Basic connectivity tests
Write-Host "1️⃣ Connectivity Tests:" -ForegroundColor Cyan
$frontendOk = Test-Url -Url $frontendUrl -Name "Frontend"
$backendOk = Test-Url -Url $backendUrl -Name "Backend"
Write-Host ""

# 2. SSL Certificate check
Write-Host "2️⃣ SSL Certificate:" -ForegroundColor Cyan
$sslOk = Test-SSL -Url $frontendUrl
Write-Host ""

# 3. API Health check
Write-Host "3️⃣ API Health:" -ForegroundColor Cyan
$apiHealthOk = Test-ApiHealth -Url $apiHealthUrl
Write-Host ""

# 4. Content verification
Write-Host "4️⃣ Content Verification:" -ForegroundColor Cyan
$frontendContentOk = Test-PageContent -Url $frontendUrl -ExpectedContent "ElectionAT" -Name "Frontend"
$backendContentOk = Test-PageContent -Url $backendUrl -ExpectedContent "NodeJS" -Name "Backend"
Write-Host ""

# 5. Security headers
Write-Host "5️⃣ Security Headers:" -ForegroundColor Cyan
$securityOk = Test-SecurityHeaders -Url $frontendUrl
Write-Host ""

# 6. Performance check
Write-Host "6️⃣ Performance Check:" -ForegroundColor Cyan
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 30 -UseBasicParsing
    $stopwatch.Stop()
    $loadTime = $stopwatch.ElapsedMilliseconds
    
    if ($loadTime -lt 2000) {
        Write-Host "✅ Page load time: ${loadTime}ms" -ForegroundColor Green
        $performanceOk = $true
    } elseif ($loadTime -lt 5000) {
        Write-Host "⚠️ Page load time: ${loadTime}ms (acceptable)" -ForegroundColor Yellow
        $performanceOk = $true
    } else {
        Write-Host "❌ Page load time: ${loadTime}ms (slow)" -ForegroundColor Red
        $performanceOk = $false
    }
    
    # Check content size
    $contentLength = $response.Headers.'Content-Length'
    if ($contentLength) {
        $sizeKB = [math]::Round([int]$contentLength / 1024, 1)
        Write-Host "   Content size: ${sizeKB} KB" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ Performance check failed: $($_.Exception.Message)" -ForegroundColor Red
    $performanceOk = $false
}
Write-Host ""

# Summary
Write-Host "📊 Health Check Summary:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$checks = @(
    @{ Name = "Frontend Connectivity"; Status = $frontendOk },
    @{ Name = "Backend Connectivity"; Status = $backendOk },
    @{ Name = "SSL Certificate"; Status = $sslOk },
    @{ Name = "API Health"; Status = $apiHealthOk },
    @{ Name = "Content Verification"; Status = $frontendContentOk -and $backendContentOk },
    @{ Name = "Security Headers"; Status = $securityOk },
    @{ Name = "Performance"; Status = $performanceOk }
)

$passedChecks = 0
foreach ($check in $checks) {
    if ($check.Status) {
        Write-Host "✅ $($check.Name)" -ForegroundColor Green
        $passedChecks++
    } else {
        Write-Host "❌ $($check.Name)" -ForegroundColor Red
    }
}

Write-Host ""
$totalChecks = $checks.Count
$successRate = [math]::Round(($passedChecks / $totalChecks) * 100, 1)

if ($successRate -eq 100) {
    Write-Host "🎉 All systems operational! ($passedChecks/$totalChecks checks passed)" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "⚠️ Mostly operational with minor issues ($passedChecks/$totalChecks checks passed)" -ForegroundColor Yellow
} else {
    Write-Host "🚨 Critical issues detected! ($passedChecks/$totalChecks checks passed)" -ForegroundColor Red
}

Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })

# Generate timestamp report
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$reportContent = @"
ElectionAT Production Health Report
Generated: $timestamp

Frontend URL: $frontendUrl
Backend URL: $backendUrl
API Health: $apiHealthUrl

Check Results:
- Frontend Connectivity: $(if ($frontendOk) { "PASS" } else { "FAIL" })
- Backend Connectivity: $(if ($backendOk) { "PASS" } else { "FAIL" })
- SSL Certificate: $(if ($sslOk) { "PASS" } else { "FAIL" })
- API Health: $(if ($apiHealthOk) { "PASS" } else { "FAIL" })
- Content Verification: $(if ($frontendContentOk -and $backendContentOk) { "PASS" } else { "FAIL" })
- Security Headers: $(if ($securityOk) { "PASS" } else { "FAIL" })
- Performance: $(if ($performanceOk) { "PASS" } else { "FAIL" })

Overall Success Rate: $successRate% ($passedChecks/$totalChecks)
Status: $(if ($successRate -eq 100) { "OPERATIONAL" } elseif ($successRate -ge 80) { "DEGRADED" } else { "CRITICAL" })

Recommendations:
$(if (-not $sslOk) { "- Renew SSL certificate" })
$(if (-not $securityOk) { "- Configure missing security headers" })
$(if (-not $performanceOk) { "- Optimize page load performance" })
$(if (-not $apiHealthOk) { "- Check backend server status" })

Next Check: Schedule this script to run every 15-30 minutes for continuous monitoring.
"@

$reportContent | Out-File -FilePath "health-check-report-$(Get-Date -Format 'yyyy-MM-dd-HHmm').txt" -Encoding UTF8

Write-Host ""
Write-Host "📋 Report saved to: health-check-report-$(Get-Date -Format 'yyyy-MM-dd-HHmm').txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 Recommended Actions:" -ForegroundColor Yellow
Write-Host "- Run this script every 15-30 minutes for monitoring" -ForegroundColor White
Write-Host "- Set up automated alerts if success rate drops below 80%" -ForegroundColor White
Write-Host "- Monitor cPanel error logs regularly" -ForegroundColor White
Write-Host "- Review and update security configurations monthly" -ForegroundColor White
