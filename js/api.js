// api.js
// Ansvarar för datahämtning från externa källor

export async function hamtaIndex() {
  try {
    const res = await fetch('https://styles.shbf.se/json/index');
    return await res.json();
  } catch (e) {
    console.error('Kunde inte hämta index', e);
    return null;
  }
}

/**
 * Ladda och parsa data från SHBF API eller lokal BJCP XML-fil
 * @param {string} kalla - 'SHBF' eller 'BJCP'
 * @param {string|number} version - Specifik version för SHBF (t.ex. 2020)
 * @returns {Promise<Object|Document>} JSON-data eller XML-dokument
 */
export async function hamtaData(kalla = 'SHBF', version = '') {
  let url = '';
  if (kalla === 'SHBF') {
    // Om versionen skickas in, hämta just den. Annars hämta en specifik URL
    url = version ? `https://styles.shbf.se/json/${version}` : 'https://styles.shbf.se/json/2020/styles';
  } else if (kalla === 'BJCP') {
    url = 'db/bjcp-beer-2021_en.xml';
  } else {
    throw new Error('Okänd källa');
  }

  const res = await fetch(url);
  if (!res.ok && res.status !== 0) {
    throw new Error('Kunde inte ladda data från ' + url);
  }

  if (kalla === 'SHBF') {
    return await res.json();
  } else {
    const text = await res.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, 'text/xml');
  }
}
