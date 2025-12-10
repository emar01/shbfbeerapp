@echo off
REM Bygg och kör appen lokalt

echo === Bygger appen ===
call build.bat -Clean

if %errorlevel% neq 0 (
    echo Build misslyckades!
    pause
    exit /b 1
)

echo.
echo === Startar lokal server ===
echo Öppna http://localhost:8000 i din webbläsare
echo Tryck Ctrl+C för att stoppa servern
echo.
cd dist
python -m http.server 8000
