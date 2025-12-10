# Öltypdefinitioner 2025

En interaktiv webbapplikation för att utforska SHBF:s och BJCP:s ölstilar. Appen visar detaljerad information om olika öltyper med tekniska parametrar, beskrivningar och quizfunktion.

## Funktioner

*   **Dubbla Datakällor:** Växla mellan SHBF (Svenska Hembryggarföreningen) och BJCP (Beer Judge Certification Program)
*   **Kategoriserad Översikt:** Ölstilar grupperade per kategori i interaktiv accordion
*   **Sökfunktion:** Filtrera ölstilar i realtid baserat på namn, bokstav eller kategori
*   **Detaljvy:** Fullständig information med visuella staplar för ABV, OG, FG, IBU och färg
*   **Quiz-funktion:** Testa dina kunskaper med slumpmässigt genererade frågor
*   **Ljust/Mörkt Läge:** Växla mellan teman för bättre läsbarhet
*   **Kategoribeskrivningar:** Utfällbar information om varje huvudklass

## Design

Applikationens design följer SHBF:s visuella identitet med orange (#d35c1c) och beige (#ffe0b2) som primärfärger. Layouten är responsiv och fungerar på både mobil och desktop.

## Teknisk Information

*   **Frontend:** HTML5, Bootstrap 5, JavaScript
*   **Dataformat:** JSON (SHBF), XML (BJCP)
*   **Ingen Backend:** All datahantering sker klient-sidigt

## Komma Igång

### Lokal utveckling

För att köra appen lokalt behöver du en webbserver (fetch() fungerar inte med `file://` protokollet).

**Alternativ 1: Python (rekommenderat)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Alternativ 2: Node.js**
```bash
npx http-server -p 8000
```

**Alternativ 3: PHP**
```bash
php -S localhost:8000
```

Öppna sedan `http://localhost:8000` i din webbläsare.

## Uppdatera SHBF-data

SHBF-data hämtas från API:et och sparas lokalt för att undvika CORS-problem:

```bash
node update-shbf-data.js
```

Detta skapar/uppdaterar `db/shbf-styles.json`.

## Deployment

För att deploya appen till en server:

1. Kopiera alla filer till servern
2. Se till att webbservern kan läsa filerna i `db/` mappen
3. Öppna `index.html` via webbservern (http/https protokoll)