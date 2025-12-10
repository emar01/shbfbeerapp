// parser.js
// Ansvarar för att parsa och transformera data från olika källor

/**
 * Extrahera och gruppera kategorier och typer ur JSON/XML enligt instruktionerna
 * @param {Object|Document} data - JSON-array från SHBF eller XML-dokument från BJCP
 * @returns {Array} Array av kategorier med typer
 */
export function parseBeerStyles(data) {
  const kategorierMap = {};
  
  // Om data är JSON (SHBF API)
  if (Array.isArray(data)) {
    parseSHBFData(data, kategorierMap);
  } else {
    // XML-struktur (BJCP eller gammal SHBF)
    parseXMLData(data, kategorierMap);
  }
  
  // Sortera kategorier på nummer, och typer på bokstav
  const kategorier = Object.values(kategorierMap)
    .sort((a, b) => String(a.nummer).localeCompare(String(b.nummer), 'sv', {numeric:true}))
    .map(kat => ({
      ...kat,
      typer: kat.typer.sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))
    }));
  return kategorier;
}

/**
 * Parsa SHBF JSON-data
 * @private
 */
function parseSHBFData(data, kategorierMap) {
  data.forEach(category => {
    const kategoriNummer = category.number || '';
    const kategoriNamn = category.name || '';
    const kategoriKey = kategoriNummer + '|' + kategoriNamn;
    
    kategorierMap[kategoriKey] = {
      namn: kategoriNamn,
      nummer: kategoriNummer,
      typer: [],
      beskrivning: category.description || ''
    };
    
    if (category.styles && Array.isArray(category.styles)) {
      category.styles.forEach(style => {
        // Bygg noter-fält från flera källor
        const notesDelar = [];
        if (style.aroma) notesDelar.push(style.aroma);
        if (style.flavor) notesDelar.push(style.flavor);
        if (style.appearance) notesDelar.push(style.appearance);
        if (style.texture) notesDelar.push(style.texture);
        const noter = notesDelar.length > 0 ? notesDelar.join('\n\n') : (style.description || '');
        
        kategorierMap[kategoriKey].typer.push({
          namn: style.name || '',
          bokstav: style.letter || '',
          kategori: kategoriNamn,
          kategoriNummer: kategoriNummer,
          typ: '',
          OG_MIN: style.ogMin || '',
          OG_MAX: style.ogMax || '',
          FG_MIN: style.fgMin || '',
          FG_MAX: style.fgMax || '',
          IBU_MIN: style.ibuMin || '',
          IBU_MAX: style.ibuMax || '',
          COLOR_MIN: style.ebcMin || '',
          COLOR_MAX: style.ebcMax || '',
          ABV_MIN: style.abvMin || '',
          ABV_MAX: style.abvMax || '',
          noter: noter,
          profil: style.summary || '',
          exempel: style.examples || ''
        });
      });
    }
  });
}

/**
 * Parsa XML-data (BJCP eller gammal SHBF)
 * @private
 */
function parseXMLData(data, kategorierMap) {
  // Försök först SHBF-struktur (STYLE)
  let styleNodes = data.querySelectorAll('STYLE');
  if (styleNodes.length > 0) {
    parseSHBFXMLData(styleNodes, kategorierMap);
  } else {
    // BJCP-struktur: <category> och <subcategory>
    parseBJCPXMLData(data, kategorierMap);
  }
}

/**
 * Parsa SHBF XML-data
 * @private
 */
function parseSHBFXMLData(styleNodes, kategorierMap) {
  styleNodes.forEach(style => {
    const kategoriNamn = style.querySelector('CATEGORY')?.textContent || '';
    const kategoriNummer = style.querySelector('CATEGORY_NUMBER')?.textContent || '';
    const kategoriKey = kategoriNummer + '|' + kategoriNamn;
    
    if (!kategorierMap[kategoriKey]) {
      // Hämta notes från style med STYLE_LETTER 'A' för denna kategori
      let beskrivning = '';
      let aNotes = '';
      for (let s of styleNodes) {
        const katNamn = s.querySelector('CATEGORY')?.textContent || '';
        const katNum = s.querySelector('CATEGORY_NUMBER')?.textContent || '';
        const styleLetter = s.querySelector('STYLE_LETTER')?.textContent || '';
        if (katNamn === kategoriNamn && katNum === kategoriNummer && styleLetter === 'A') {
          aNotes = s.querySelector('NOTES')?.textContent || '';
          break;
        }
      }
      // Visa endast om notes verkar vara en kategoribeskrivning
      if (aNotes) {
        const lowerNotes = aNotes.toLowerCase();
        const lowerKat = kategoriNamn.toLowerCase();
        if (lowerNotes.includes(lowerKat) || aNotes.length > 200) {
          beskrivning = aNotes;
        }
      }
      kategorierMap[kategoriKey] = {
        namn: kategoriNamn,
        nummer: kategoriNummer,
        typer: [],
        beskrivning
      };
    }
    
    kategorierMap[kategoriKey].typer.push({
      namn: style.querySelector('NAME')?.textContent || '',
      bokstav: style.querySelector('STYLE_LETTER')?.textContent || '',
      kategori: kategoriNamn,
      kategoriNummer: kategoriNummer,
      typ: style.querySelector('TYPE')?.textContent || '',
      OG_MIN: style.querySelector('OG_MIN')?.textContent || '',
      OG_MAX: style.querySelector('OG_MAX')?.textContent || '',
      FG_MIN: style.querySelector('FG_MIN')?.textContent || '',
      FG_MAX: style.querySelector('FG_MAX')?.textContent || '',
      IBU_MIN: style.querySelector('IBU_MIN')?.textContent || '',
      IBU_MAX: style.querySelector('IBU_MAX')?.textContent || '',
      COLOR_MIN: style.querySelector('COLOR_MIN')?.textContent || '',
      COLOR_MAX: style.querySelector('COLOR_MAX')?.textContent || '',
      ABV_MIN: style.querySelector('ABV_MIN')?.textContent || '',
      ABV_MAX: style.querySelector('ABV_MAX')?.textContent || '',
      noter: style.querySelector('NOTES')?.textContent || '',
      profil: style.querySelector('PROFILE')?.textContent || '',
      exempel: style.querySelector('EXAMPLES')?.textContent || ''
    });
  });
}

/**
 * Parsa BJCP XML-data
 * @private
 */
function parseBJCPXMLData(data, kategorierMap) {
  let categoryNodes = data.querySelectorAll('category');
  categoryNodes.forEach(category => {
    const kategoriNummer = category.getAttribute('id') || '';
    const kategoriNamn = category.querySelector('name')?.textContent || '';
    const kategoriKey = kategoriNummer + '|' + kategoriNamn;
    
    // Hämta notes från category-taggen
    let beskrivning = '';
    const notesNode = category.querySelector('notes');
    if (notesNode) beskrivning = notesNode.textContent || '';
    
    if (!kategorierMap[kategoriKey]) {
      kategorierMap[kategoriKey] = {
        namn: kategoriNamn,
        nummer: kategoriNummer,
        typer: [],
        beskrivning
      };
    }
    
    const subNodes = category.querySelectorAll('subcategory');
    subNodes.forEach(sub => {
      const subNamn = sub.querySelector('name')?.textContent || '';
      const subId = sub.getAttribute('id') || '';
      
      // Hämta notes/body
      let noter = '';
      let bodyNode = sub.querySelector('body');
      if (bodyNode) {
        noter = bodyNode.innerHTML
          .replace(/<br\s*\/?>(\s*)?/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .trim();
      }
      
      // Hämta stats
      let OG_MIN = '', OG_MAX = '', FG_MIN = '', FG_MAX = '';
      let ABV_MIN = '', ABV_MAX = '', IBU_MIN = '', IBU_MAX = '';
      let COLOR_MIN = '', COLOR_MAX = '';
      
      const statsNodes = sub.querySelectorAll('stats');
      statsNodes.forEach(stat => {
        const typ = stat.querySelector('type')?.textContent?.toLowerCase() || '';
        const low = stat.querySelector('low')?.textContent || '';
        const high = stat.querySelector('high')?.textContent || '';
        if (typ === 'og') { OG_MIN = low; OG_MAX = high; }
        if (typ === 'fg') { FG_MIN = low; FG_MAX = high; }
        if (typ === 'abv') { ABV_MIN = low; ABV_MAX = high; }
        if (typ === 'ibu') { IBU_MIN = low; IBU_MAX = high; }
        if (typ === 'srm') { COLOR_MIN = low; COLOR_MAX = high; }
      });
      
      kategorierMap[kategoriKey].typer.push({
        namn: subNamn,
        bokstav: subId.replace(/^[0-9]+/, ''),
        kategori: kategoriNamn,
        kategoriNummer: kategoriNummer,
        typ: '',
        OG_MIN,
        OG_MAX,
        FG_MIN,
        FG_MAX,
        IBU_MIN,
        IBU_MAX,
        COLOR_MIN,
        COLOR_MAX,
        ABV_MIN,
        ABV_MAX,
        noter,
        profil: '',
        exempel: ''
      });
    });
  });
}
