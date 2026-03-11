# New Intern Photos Setup Script
# Adds images for M-A008, M-A009, M-A010, M-A011
#
# INSTRUCTIONS:
# 1. Save the 4 intern photos to your Downloads folder with these EXACT names:
#    - M-A008.jpg  (Sunkari Akshar - white t-shirt, outdoor photo)
#    - M-A009.jpg  (Nithin Yelamati - purple shirt, blue background)
#    - M-A010.jpg  (Praneep Sri - white shirt, red curtain)
#    - M-A011.jpg  (Manideep Botsa - plaid shirt, selfie)
#
# 2. Run this script: .\setup-new-interns.ps1
#
# The script will move and convert the images to the correct location.

Write-Host "=== matriXO New Intern Photos Setup ===" -ForegroundColor Cyan
Write-Host ""

$internFolder = ".\public\intern-images"
if (-not (Test-Path $internFolder)) {
    New-Item -Path $internFolder -ItemType Directory -Force | Out-Null
    Write-Host "Created intern-images folder" -ForegroundColor Green
}

$downloadFolder = "$env:USERPROFILE\Downloads"

$interns = @(
    @{ Id = "M-A008"; Name = "Sunkari Akshar" },
    @{ Id = "M-A009"; Name = "Nithin Yelamati" },
    @{ Id = "M-A010"; Name = "Praneep Sri" },
    @{ Id = "M-A011"; Name = "Manideep Botsa" }
)

$moved = 0

foreach ($intern in $interns) {
    $id = $intern.Id
    $name = $intern.Name
    $destPath = Join-Path $internFolder "$id.webp"
    
    # Check if already exists
    if (Test-Path $destPath) {
        Write-Host "  $id ($name) - Already exists!" -ForegroundColor Green
        $moved++
        continue
    }
    
    # Try multiple extensions from Downloads
    $extensions = @(".jpg", ".jpeg", ".png", ".webp")
    $found = $false
    
    foreach ($ext in $extensions) {
        $sourcePath = Join-Path $downloadFolder "$id$ext"
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath $destPath -Force
            Write-Host "  $id ($name) - Copied from Downloads!" -ForegroundColor Green
            $moved++
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        # Also try name-based files
        $nameClean = $name -replace ' ', '-'
        foreach ($ext in $extensions) {
            $sourcePath = Join-Path $downloadFolder "$nameClean$ext"
            if (Test-Path $sourcePath) {
                Copy-Item $sourcePath $destPath -Force
                Write-Host "  $id ($name) - Copied from Downloads (by name)!" -ForegroundColor Green
                $moved++
                $found = $true
                break
            }
        }
    }
    
    if (-not $found) {
        Write-Host "  $id ($name) - NOT FOUND in Downloads" -ForegroundColor Red
        Write-Host "    Save the photo as '$id.jpg' (or .png/.webp) in your Downloads folder" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== STATUS ===" -ForegroundColor Cyan
Write-Host "  $moved / $($interns.Count) photos ready" -ForegroundColor $(if ($moved -eq $interns.Count) { "Green" } else { "Yellow" })
Write-Host ""

if ($moved -eq $interns.Count) {
    Write-Host "All photos are in place! Now update Firestore:" -ForegroundColor Green
    Write-Host "  Run: node update-intern-images.js" -ForegroundColor White
} else {
    Write-Host "Save missing photos to Downloads and run this script again." -ForegroundColor Yellow
}
