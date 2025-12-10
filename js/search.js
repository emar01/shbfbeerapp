// search.js
// Ansvarar för sökfunktionalitet

/**
 * Filtrera kategorier baserat på sökterm
 * Sökning: visa ENDAST träffade typer (stilar), inte kategorier
 * @param {string} sokterm - Sökterm att filtrera på
 * @param {Array} kategorier - Array av kategorier att söka i
 * @returns {Array} Filtrerade kategorier
 */
export function filtreraKategorier(sokterm, kategorier) {
  sokterm = sokterm.toLowerCase();
  if (!sokterm) return kategorier;
  
  // Samla alla typer som matchar
  const matchandeTyper = [];
  kategorier.forEach(kat => {
    kat.typer.forEach(typ => {
      if (
        typ.namn.toLowerCase().includes(sokterm) ||
        typ.bokstav.toLowerCase().includes(sokterm) ||
        kat.namn.toLowerCase().includes(sokterm)
      ) {
        matchandeTyper.push({ ...typ, kategori: kat.namn, kategoriNummer: kat.nummer });
      }
    });
  });
  
  // Visa alla träffade typer i en "kategori" (sökresultat), sortera på bokstav
  if (matchandeTyper.length > 0) {
    const sorteradeTyper = matchandeTyper.slice().sort((a, b) => a.bokstav.localeCompare(b.bokstav, 'sv'));
    return [{
      namn: 'Sökresultat',
      nummer: '',
      typer: sorteradeTyper
    }];
  }
  return [];
}
