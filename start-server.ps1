Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  QR Kode Generator Server" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Tjek om node_modules eksisterer
if (-not (Test-Path "node_modules")) {
    Write-Host "Installerer dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "Starter serveren..." -ForegroundColor Green
Write-Host ""
Write-Host "Tryk Ctrl+C for at stoppe serveren" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

npm start
