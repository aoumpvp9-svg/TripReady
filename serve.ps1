# TripReady 실행 스크립트 (PowerShell)
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  ✈️ TripReady - 여행 준비물 체크리스트" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

$port = 3050
$url = "http://localhost:$port"

# 브라우저 실행
Start-Process $url

# Node.js 웹서버 시작
$env:PORT = "$port"
node serve.js
