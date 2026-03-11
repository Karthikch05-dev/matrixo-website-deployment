# Team Photos Quick Setup Script
# Run this after downloading the LinkedIn profile photos

Write-Host "=== matriXO Team Photos Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if team folder exists
$teamFolder = ".\public\team"
if (-not (Test-Path $teamFolder)) {
    New-Item -Path $teamFolder -ItemType Directory -Force | Out-Null
    Write-Host "Created team folder" -ForegroundColor Green
}

# Team member info
Write-Host "Team Members LinkedIn Profiles:" -ForegroundColor Yellow
Write-Host "1. Shiva Ganesh Talikota" -ForegroundColor White
Write-Host "   https://linkedin.com/in/shivaganesht" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Kishan Sai Vutukuri" -ForegroundColor White
Write-Host "   https://www.linkedin.com/in/kishan-sai-vutukuri/" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Jatin Jangir" -ForegroundColor White
Write-Host "   https://www.linkedin.com/in/astro-jatin-jangir-0287a6228" -ForegroundColor Gray
Write-Host ""

# Instructions
Write-Host "=== INSTRUCTIONS ===" -ForegroundColor Cyan
Write-Host "1. Visit each LinkedIn profile above" -ForegroundColor White
Write-Host "2. Right-click their profile photo and Save Image As" -ForegroundColor White
Write-Host "3. Save as: shiva.jpg, kishan.jpg, jatin.jpg in Downloads" -ForegroundColor White
Write-Host ""

# Check current status
Write-Host "=== CURRENT STATUS ===" -ForegroundColor Cyan
$photos = @("shiva.jpg", "kishan.jpg", "jatin.jpg")
foreach ($photo in $photos) {
    $path = Join-Path $teamFolder $photo
    if (Test-Path $path) {
        Write-Host "  $photo - Found!" -ForegroundColor Green
    } else {
        Write-Host "  $photo - Not found" -ForegroundColor Red
    }
}

Write-Host ""

# Auto-move from Downloads if available
$downloadFolder = "$env:USERPROFILE\Downloads"
$moved = 0

foreach ($photo in $photos) {
    $sourcePath = Join-Path $downloadFolder $photo
    $destPath = Join-Path $teamFolder $photo
    
    if (Test-Path $sourcePath) {
        Move-Item $sourcePath $destPath -Force
        Write-Host "Moved $photo to team folder" -ForegroundColor Green
        $moved++
    }
}

if ($moved -gt 0) {
    Write-Host ""
    Write-Host "Successfully moved $moved photo(s)!" -ForegroundColor Green
} else {
    Write-Host "No photos found in Downloads. Download them from LinkedIn first!" -ForegroundColor Yellow
}

Write-Host ""
