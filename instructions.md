## 9. Quiz-funktion

- Skapa en quiz-funktion där användaren får 10 frågor baserade på innehållet i `beerXML-generate.xml`.
- Frågorna ska slumpas och kan t.ex. handla om stilnamn, kategori, OG, FG, ABV, IBU, färg, profil eller exempel.
- Quizzen ska vara helt på svenska och använda data direkt från XML-filen.
- Använd bilderna i `assets`-mappen som heter något med `quiz` (t.ex. `quiz.jpeg`, `quiz2.jpeg`) som inspiration för design och layout.
- Efter quizzen ska användaren få se sitt resultat och rätt svar.
# Instruktioner för Beer Styles 2020 Webbapp

Denna fil beskriver hur du bygger en webbapp för att visa ölstilar enligt SHBF 2020, baserat på beerXML-generate.xml och skärmbilderna.



## 1. Datahantering
- Använd `beerXML-generate.xml` direkt som databas för ölstilar.
- **OBS:** XML-filen har en flat struktur där varje `<STYLE>`-element representerar en ölstil med kategori, typ, bokstav, m.m. (se exempel nedan).
- Appen grupperar automatiskt stilarna per kategori och kategori-nummer i JavaScript, så du behöver inte ändra XML-filen.
- Läs och parsa XML-filen direkt i JavaScript vid behov.
- All text ska vara på svenska och specialtecken ska avkodas vid visning.

## 2. Webbappens struktur
- Bygg med HTML5, Bootstrap 5 och javascript (ingen backend krävs).
- Sidan ska ha:
  - En toppbar med logotyp och titel (se skärmbilder)
  - En sökruta
  - Lista på alla kategorier (accordion/utvecklingsbar lista)
  - Under varje kategori: lista på alla typer (stilar)
  - Klick på kategori: vecklar ut/ihop typerna
  - Klick på typ: visar detaljerad info (i panel eller modal)


## 3. Design

- Färger, typsnitt och layout ska utgå från bilderna i `assets`-mappen.
- **Startsidan** (kategori- och typ-lista) ska följa utseendet i `assets/image3.jpeg`.
- **Detaljsidan** för en typ (modal/panel) ska följa utseendet i `assets/image2.jpeg`.
- Kategorier och typer ska ha samma färg och stil som i bilderna.
- Detaljvyn ska visa alla fält (OG, FG, ABV, IBU, Färg, Noter, Profil, Exempel) på ett tydligt och snyggt sätt enligt bild.
- Responsiv design för mobil och desktop.


## 4. Funktionalitet

- Sökfältet ska filtrera både kategorier och typer i realtid, men **visa endast träffade typer (stilar)** i resultatet – inte kategorier.
- Endast en kategori kan vara öppen åt gången (accordion).
- Endast en typdetalj kan visas åt gången.
- All data laddas från `beerXML-generate.xml`.

## 5. Extra
- All kod och text ska vara på svenska.
- Använd Bootstrap-komponenter för UI.
- Ingen backend eller databas krävs.
- Allt ska fungera lokalt i webbläsaren.


## 6. Exempel på datastruktur (beerXML-generate.xml)

XML-filen består av en flat lista av `<STYLE>`-element, t.ex.:

```xml
<STYLES>
  <STYLE>
    <NAME>Helles</NAME>
    <STYLE_LETTER>A</STYLE_LETTER>
    <CATEGORY>Mild/karaktärsfull Lager</CATEGORY>
    <CATEGORY_NUMBER>1</CATEGORY_NUMBER>
    <TYPE>Lager</TYPE>
    <OG_MIN>1.044</OG_MIN>
    <OG_MAX>1.050</OG_MAX>
    ...
  </STYLE>
  <!-- Fler STYLE-element -->
</STYLES>
```

Appen grupperar automatiskt dessa till rätt struktur i JavaScript.

## 7. Tips
- Använd [Bootstrap Accordion](https://getbootstrap.com/docs/5.0/components/accordion/) för kategorilistan.
- Använd [Bootstrap Modal](https://getbootstrap.com/docs/5.0/components/modal/) eller en panel för typdetaljer.
- Använd [Bootstrap Form](https://getbootstrap.com/docs/5.0/forms/input-group/) för sökrutan.
- Färger: använd orange (#d35c1c), beige (#ffe0b2), vit och svart enligt bilderna.
- Typsnitt: använd sans-serif, gärna samma som i bilderna.

## 8. Vid frågor
Fråga om du är osäker på något steg eller vill ha exempel på kod.
