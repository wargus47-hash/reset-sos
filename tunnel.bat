@echo off
cd /d "%~dp0"
echo.
echo  Demarrage du tunnel Expo (iOS distant)...
echo.
npx expo start --tunnel --port 8082
pause
