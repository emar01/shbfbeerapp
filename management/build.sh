#!/bin/bash
# Build script för att skapa distributionsmapp
# Skapar en 'dist' mapp med alla nödvändiga filer för att köra appen

set -e

echo "=== Bygger distributionsmapp ==="

# Ta bort dist-mappen om den finns
if [ -d "dist" ]; then
    echo "Rensar befintlig dist-mapp..."
    rm -rf dist
fi

# Skapa dist-mappen och undermappar
echo "Skapar mappar..."
mkdir -p dist/js
mkdir -p dist/assets
mkdir -p dist/db

# Kopiera HTML och CSS
echo "Kopierar HTML och CSS..."
cp index.html dist/
cp style.css dist/

# Kopiera alla JavaScript-moduler
echo "Kopierar JavaScript-moduler..."
cp js/*.js dist/js/ 2>/dev/null || true

# Kopiera assets
echo "Kopierar assets..."
if [ -d "assets" ]; then
    cp -r assets/* dist/assets/ 2>/dev/null || true
fi

# Kopiera databas-filer
echo "Kopierar databas-filer..."
if [ -d "db" ]; then
    cp db/*.xml dist/db/ 2>/dev/null || true
    cp db/*.json dist/db/ 2>/dev/null || true
fi

# Skapa en README i dist
cat > dist/README.md << 'EOF'
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
```
python -m http.server 8000
```
Öppna sedan http://localhost:8000

## Exempel med Node.js
```
npx serve
```
EOF

# Sammanfattning
echo ""
echo "=== Build klar! ==="
echo "Dist-mappen innehåller:"
find dist -type f | sed 's|dist/|  - |'

TOTAL_SIZE=$(du -sh dist | cut -f1)
echo ""
echo "Total storlek: $TOTAL_SIZE"
echo ""
echo "För att testa lokalt, kör:"
echo "  cd dist"
echo "  python -m http.server 8000"
echo "  (eller: npx serve)"
