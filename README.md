# Beer Styles 2020 Webbapp

En interaktiv webbapplikation för att utforska SHBF:s ölstilar från 2020, baserad på data från en BeerXML-fil. Appen är byggd med HTML5, Bootstrap 5 och ren JavaScript, utan krav på backend.

## Funktioner

*   **Ölstilsdata:** Visar detaljerad information om ölstilar direkt från `beerXML-generate.xml`.
*   **Kategoriserad Översikt:** Ölstilar är grupperade per kategori i en interaktiv dragspelsmeny (accordion).
*   **Sökfunktion:** Filtrera ölstilar i realtid baserat på namn, bokstav eller kategori.
*   **Detaljvy:** Klicka på en ölstil för att se dess fullständiga detaljer i en modalvy, inklusive OG, FG, ABV, IBU, färg, noter, profil och exempel.
*   **Quiz-funktion:** Testa dina kunskaper om ölstilar med ett slumpmässigt genererat quiz baserat på XML-datan.
*   **Ljust/Mörkt Läge:** Växla enkelt mellan ett ljust och mörkt tema för en anpassad användarupplevelse.

## Design och Användarupplevelse

Applikationens design följer SHBF:s visuella identitet med färger som orange (#d35c1c), beige (#ffe0b2), vitt och svart. Layouten är responsiv och anpassar sig för både mobil- och desktop-enheter, inspirerad av designbilder i `assets`-mappen.

## Teknisk Information

*   **Frontend:** HTML5, Bootstrap 5, JavaScript
*   **Dataformat:** BeerXML (`beerXML-generate.xml`)
*   **Ingen Backend:** All datahantering och logik sker klient-sidigt i webbläsaren.

## Komma Igång

1.  Klona detta repository: `git clone https://github.com/emar01/shbfbeerapp.git`
2.  Öppna `web/index.html` i din webbläsare.

## Förhandsgranskning

Se en live-version av applikationen här:
https://htmlpreview.github.io/?https://github.com/emar01/shbfbeerapp/blob/master/web/index.html