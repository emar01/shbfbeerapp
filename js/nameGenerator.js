// nameGenerator.js
// Ansvarar för att generera ölnamn

const adjectives = [
  "Mörk", "Ljus", "Fruktig", "Bitter", "Söt", "Torr", "Fyllig", "Klar", "Grumlig",
  "Frisk", "Kryddig", "Rökig", "Chokladig", "Kaffig", "Citrusig", "Tropisk",
  "Vinter", "Sommar", "Höst", "Vår", "Natt", "Dag", "Morgon", "Kväll",
  "Gyllene", "Rubinröd", "Svart", "Vit", "Blå", "Grön", "Röd", "Gul",
  "Mystisk", "Legendarisk", "Forntida", "Modern", "Klassisk", "Innovativ",
  "Vild", "Tam", "Stark", "Svag", "Långsam", "Snabb", "Tyst", "Högljudd"
];

const nouns = [
  "Ale", "Lager", "Stout", "Porter", "IPA", "Pilsner", "Veteöl", "Suröl",
  "Brygd", "Elixir", "Nektar", "Dryck", "Essens", "Ande", "Själ", "Hjärta",
  "Dröm", "Vision", "Saga", "Legend", "Myt", "Historia", "Äventyr", "Resa",
  "Sol", "Måne", "Stjärna", "Moln", "Regn", "Snö", "Is", "Vind", "Storm",
  "Berg", "Dal", "Sjö", "Flod", "Skog", "Träd", "Blomma", "Frukt", "Bär",
  "Drake", "Lejon", "Varg", "Björn", "Örn", "Falk", "Uggla", "Räv", "Häst"
];

/**
 * Generera ett slumpmässigt ölnamn
 * @returns {string} Genererat ölnamn
 */
export function generateBeerName() {
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}
