@echo off
title RESET SOS — Dev Server
color 17

echo.
echo  ============================================
echo   RESET SOS — Lancement du serveur de dev
echo  ============================================
echo.
echo  Demarrage en cours...
echo  Scanne le QR code avec Expo Go sur ton telephone.
echo.
echo  Pour arreter : appuie sur Ctrl+C
echo.

cd /d "%~dp0"
npx expo start

pause
