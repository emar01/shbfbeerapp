# Build script för att skapa distributionsmapp
# Skapar en 'dist' mapp med alla nödvändiga filer för att köra appen

param(
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== Bygger distributionsmapp ===" -ForegroundColor Cyan

# Ta bort dist-mappen om den finns (och -Clean är satt eller den redan finns)
if (Test-Path "dist") {
    if ($Clean) {
        Write-Host "Rensar befintlig dist-mapp..." -ForegroundColor Yellow
        Remove-Item -Path "dist" -Recurse -Force
    } else {
        Write-Host "Dist-mappen finns redan. Kör med -Clean för att rensa först." -ForegroundColor Yellow
        exit 1
    }
}

# Skapa dist-mappen och undermappar
Write-Host "Skapar mappar..." -ForegroundColor Green
New-Item -ItemType Directory -Path "dist" -Force | Out-Null
New-Item -ItemType Directory -Path "dist/js" -Force | Out-Null
New-Item -ItemType Directory -Path "dist/assets" -Force | Out-Null
New-Item -ItemType Directory -Path "dist/db" -Force | Out-Null

# Kopiera HTML och CSS
Write-Host "Kopierar HTML och CSS..." -ForegroundColor Green
Copy-Item "index.html" -Destination "dist/"
Copy-Item "style.css" -Destination "dist/"

# Kopiera alla JavaScript-moduler
Write-Host "Kopierar JavaScript-moduler..." -ForegroundColor Green
Copy-Item "js/*.js" -Destination "dist/js/" -Exclude "*.test.js"

# Kopiera assets
Write-Host "Kopierar assets..." -ForegroundColor Green
if (Test-Path "assets") {
    Copy-Item "assets/*" -Destination "dist/assets/" -Recurse
}

# Kopiera databas-filer
Write-Host "Kopierar databas-filer..." -ForegroundColor Green
if (Test-Path "db") {
    Copy-Item "db/*.xml" -Destination "dist/db/" -ErrorAction SilentlyContinue
    Copy-Item "db/*.json" -Destination "dist/db/" -ErrorAction SilentlyContinue
}

# Skapa en README i dist
$distReadme = @"
# Distribution Build

Denna mapp innehåller alla filer som behövs för att köra applikationen.

## Innehåll
- index.html - Huvudfil
- style.css - Styling
- js/ - Alla JavaScript-moduler
- assets/ - Bilder och ikoner
- db/ - Databasfiler (XML/JSON)

## Hur man kör
1. Servera denna mapp via en webbserver (ES6 modules kräver HTTP/HTTPS)
2. Öppna index.html i webbläsaren

## Exempel med Python
``````
python -m http.server 8000
``````
Öppna sedan http://localhost:8000

## Exempel med Node.js
``````
npx serve
``````
"@

Set-Content -Path "dist/README.md" -Value $distReadme

# Sammanfattning
Write-Host "`n=== Build klar! ===" -ForegroundColor Green
Write-Host "Dist-mappen innehåller:" -ForegroundColor Cyan
Get-ChildItem -Path "dist" -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\dist\", "")
    Write-Host "  - $relativePath" -ForegroundColor Gray
}

$totalSize = (Get-ChildItem -Path "dist" -Recurse -File | Measure-Object -Property Length -Sum).Sum
$sizeKB = [math]::Round($totalSize / 1KB, 2)
$sizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "`nTotal storlek: $sizeKB KB ($sizeMB MB)" -ForegroundColor Cyan
Write-Host "`nFör att testa lokalt, kör:" -ForegroundColor Yellow
Write-Host "  cd dist" -ForegroundColor White
Write-Host "  python -m http.server 8000" -ForegroundColor White
Write-Host "  (eller: npx serve)" -ForegroundColor White
