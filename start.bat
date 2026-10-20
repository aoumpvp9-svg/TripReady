@echo off
chcp 65001 > nul
title TripReady - 여행 준비물 체크리스트
echo ===================================================
echo   ✈️ TripReady - 여행 준비물 체크리스트 실행
echo ===================================================
echo.
echo 브라우저를 실행하고 로컬 서버를 시작합니다...
start http://localhost:3050
node serve.js
pause
