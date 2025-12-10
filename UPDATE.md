# Uppdatering av SHBF-data

## Automatisk uppdatering

För att uppdatera SHBF-data till den senaste versionen, kör:

```bash
node update-shbf-data.js
```

Detta laddar ner den senaste datan från `https://styles.shbf.se/json/2020/styles` och sparar den i `db/shbf-styles.json`.

## När ska data uppdateras?

- När nya ölstilar läggs till i SHBF:s typdefinitioner
- Vid ändringar i befintliga typdefinitioner
- Rekommenderat: Kör scriptet regelbundet (t.ex. en gång i månaden)

## Felsökning

Om nedladdningen misslyckas:
1. Kontrollera din internetanslutning
2. Verifiera att API:et är tillgängligt på https://styles.shbf.se/json/2020/styles
3. Kör scriptet igen

## Filstruktur

- `db/shbf-styles.json` - SHBF-data (uppdateras via script)
- `db/bjcp-beer-2021_en.xml` - BJCP-data (statisk fil)
