# JavaScript-modulstruktur

Koden är nu uppdelad i modulära filer för bättre underhåll och teamutveckling.

## Modulöversikt

### `js/api.js`
**Ansvar:** Datahämtning från externa källor
- `hamtaData(kalla)` - Hämtar data från SHBF API eller lokal BJCP XML-fil

### `js/parser.js`
**Ansvar:** Databearbetning och transformation
- `parseBeerStyles(data)` - Parsar och strukturerar data från olika källor
- Stöd för både SHBF JSON och BJCP/SHBF XML-format

### `js/renderer.js`
**Ansvar:** UI-rendering
- `renderAccordion(kategorier)` - Renderar kategori-accordion
- `visaTypDetalj(katNamn, typNamn)` - Visar detaljerad typinformation i modal
- Hanterar datastaplar och formatering

### `js/search.js`
**Ansvar:** Sökfunktionalitet
- `filtreraKategorier(sokterm, kategorier)` - Filtrerar kategorier baserat på sökterm

### `js/quiz.js`
**Ansvar:** Quiz-funktionalitet
- `startaQuiz()` - Startar ett nytt quiz
- `svaraQuiz(i)` - Hanterar svar på quiz-frågor
- `gaForegaendeFraga()` / `gaNastaFraga()` - Navigering
- `visaQuizResultat()` - Visar slutresultat
- Innehåller regelmotor för quiz-frågor

### `js/nameGenerator.js`
**Ansvar:** Namngenererare
- `generateBeerName()` - Genererar slumpmässiga ölnamn

### `js/theme.js`
**Ansvar:** Temaväxling
- `initTheme()` - Initierar och hanterar ljust/mörkt tema

### `js/app.js`
**Ansvar:** Huvudapplikation och koordinering
- Importerar och koordinerar alla moduler
- Registrerar event listeners
- Exponerar funktioner till globalt scope för onclick-handlers

## Fördelar med den nya strukturen

1. **Separation of Concerns** - Varje modul har ett tydligt ansvarsområde
2. **Lättare att testa** - Moduler kan testas isolerat
3. **Bättre översikt** - Mindre filer är lättare att förstå
4. **Teamvänlig** - Flera utvecklare kan arbeta parallellt på olika moduler
5. **Enkel att underhålla** - Ändringar påverkar bara relevanta moduler
6. **Skalbar** - Lätt att lägga till ny funktionalitet

## Användning

Modulerna använder ES6 import/export och laddas som type="module" i HTML:
```html
<script type="module" src="js/app.js"></script>
```

## Migration

Den gamla monolitiska `app.js` har sparats som `app.old.js` för backup.
