# Build och Distribution

## Bygga distributionsmappen

För att skapa en `dist`-mapp med alla nödvändiga filer:

### Windows (PowerShell)
```powershell
.\build.ps1 -Clean
```

### Linux/Mac (eller Git Bash på Windows)
```bash
chmod +x build.sh
./build.sh
```

## Testa lokalt

Efter bygget, testa appen lokalt:

```powershell
cd dist
python -m http.server 8000
```

Öppna sedan http://localhost:8000 i din webbläsare.

Alternativt med Node.js:
```powershell
cd dist
npx serve
```

## GitHub Actions

Vid push till `main` kommer GitHub Actions automatiskt att:
1. Köra build-scriptet
2. Validera att alla viktiga filer finns
3. Ladda upp `dist` som en artifact (kan laddas ner från Actions-sidan)
4. Deploya till GitHub Pages (om aktiverat)

## Vad ingår i dist?

- `index.html` - Huvudfilen
- `style.css` - All styling
- `js/` - Alla JavaScript-moduler
- `assets/` - Bilder, ikoner, etc.
- `db/` - Databasfiler (BJCP XML, etc.)

## Vad ingår INTE i dist?

- `app.old.js` - Backup-filer
- `.git/` - Git-historik
- `.github/` - GitHub Actions workflows
- `node_modules/` - Dev dependencies
- Test-filer
- Dokumentation (README, REFACTORING.md, etc.)
- Build-script själva
