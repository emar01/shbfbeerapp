#!/bin/bash
# Detta skript bygger applikationen och startar en lokal webbserver.

# Gå till projektets rotmapp från skriptets plats
cd "$(dirname "$0")/.."

echo "=== Steg 1: Bygger applikationen... ==="
bash management/build.sh

echo ""
echo "=== Steg 2: Startar webbservern... ==="
echo "Appen kommer att finnas tillgänglig på http://localhost:8000"
echo "Tryck på Ctrl+C i terminalen för att stoppa servern."
echo ""

# Starta servern för den byggda applikationen i dist-mappen
npx http-server dist -p 8000
