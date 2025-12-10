// api.js
// Ansvarar för datahämtning från externa källor

/**
 * Ladda och parsa data från SHBF API eller lokal BJCP XML-fil
 * @param {string} kalla - 'SHBF' eller 'BJCP'
 * @returns {Promise<Object|Document>} JSON-data eller XML-dokument
 */
export async function hamtaData(kalla = 'SHBF') {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let url;
    
    if (kalla === 'SHBF') {
      url = 'https://styles.shbf.se/json/2020/styles';
    } else if (kalla === 'BJCP') {
      url = 'db/bjcp-beer-2021_en.xml';
    } else {
      reject(new Error('Okänd källa'));
      return;
    }
    
    xhr.open('GET', url, true);
    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) { // 0 för file:// protokoll
        if (kalla === 'SHBF') {
          try {
            const json = JSON.parse(xhr.responseText);
            resolve(json);
          } catch (e) {
            reject(new Error('Kunde inte parsa JSON: ' + e.message));
          }
        } else {
          const parser = new DOMParser();
          const xml = parser.parseFromString(xhr.responseText, 'text/xml');
          resolve(xml);
        }
      } else {
        reject(new Error('Kunde inte ladda data från ' + url));
      }
    };
    xhr.onerror = () => reject(new Error('Fel vid laddning av ' + url));
    xhr.send();
  });
}
