// app.js
// All kod på svenska

// Ladda och parsa data från SHBF API eller lokal BJCP XML-fil
async function hamtaData(kalla = 'SHBF') {
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

// Extrahera och gruppera kategorier och typer ur JSON/XML enligt instruktionerna
function parseBeerStyles(data) {
  const kategorierMap = {};
  
  // Om data är JSON (SHBF API)
  if (Array.isArray(data)) {
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
  } else {
    // XML-struktur (BJCP eller gammal SHBF)
    // Försök först SHBF-struktur (STYLE)
    let styleNodes = data.querySelectorAll('STYLE');
    if (styleNodes.length > 0) {
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
          // Visa endast om notes verkar vara en kategoribeskrivning (väldigt enkel heuristik: om texten nämner kategorinamnet eller är ovanligt lång)
          if (aNotes) {
            const lowerNotes = aNotes.toLowerCase();
            const lowerKat = kategoriNamn.toLowerCase();
            if (lowerNotes.includes(lowerKat) || aNotes.length > 200) {
              beskrivning = aNotes;
            } else {
              beskrivning = '';
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
    } else {
      // BJCP-struktur: <category> och <subcategory>
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
        let OG_MIN = '', OG_MAX = '', FG_MIN = '', FG_MAX = '', ABV_MIN = '', ABV_MAX = '', IBU_MIN = '', IBU_MAX = '', COLOR_MIN = '', COLOR_MAX = '';
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

// Rendera kategorier och typer
function renderAccordion(kategorier) {
  const acc = document.getElementById('accordionKategori');
  acc.innerHTML = '';
  // Om det bara finns en "kategori" och den heter Sökresultat, visa typ-listan direkt
  if (kategorier.length === 1 && kategorier[0].namn === 'Sökresultat') {
    const typerList = kategorier[0].typer.map(typ => {
      const typKod = `${typ.kategoriNummer}${typ.bokstav}`;
      return `
      <li class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" style="cursor:pointer" onclick="visaTypDetalj('${typ.kategori.replace(/'/g, "'")}', '${typ.namn.replace(/'/g, "'")}', this)">
        <span class="badge rounded-pill bg-orange fs-6 fw-bold" style="min-width:2.5rem;">${typKod}</span>
        <span class="fw-semibold">${typ.namn}</span>
        <span class="text-muted ms-auto small">${typ.kategori}</span>
      </li>`;
    }).join('');
    acc.innerHTML = `<div class="card mb-3"><div class="card-header bg-orange text-white fw-bold">Sökresultat</div><ul class="list-group list-group-flush">${typerList}</ul></div>`;
    return;
  }
  // Annars visa accordion som vanligt
  kategorier.forEach((kat, i) => {
    // Sortera typer på bokstav A-Ö
    const sorteradeTyper = kat.typer.slice().sort((a, b) => a.bokstav.localeCompare(b.bokstav, 'sv'));
    const typerList = sorteradeTyper.map(typ => {
      const typKod = `${typ.kategoriNummer}${typ.bokstav}`;
      return `
      <li class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" style="cursor:pointer" onclick="visaTypDetalj('${kat.namn.replace(/'/g, "'")}', '${typ.namn.replace(/'/g, "'")}', this)">
        <span class="badge rounded-pill bg-orange fs-6 fw-bold" style="min-width:2.5rem;">${typKod}</span>
        <span class="fw-semibold">${typ.namn}</span>
      </li>`;
    }).join('');
    
    // Kategoribeskrivning om den finns - dold som standard
    const beskrivningHTML = kat.beskrivning && kat.beskrivning.trim() !== '' 
      ? `<div class="px-3 pt-2 pb-0">
          <button class="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2" 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target="#beskrivning${i}" 
                  aria-expanded="false" 
                  aria-controls="beskrivning${i}">
            <i class="bi bi-info-circle"></i>
            <span>Om huvudklassen</span>
            <i class="bi bi-chevron-down ms-auto"></i>
          </button>
        </div>
        <div class="collapse" id="beskrivning${i}">
          <div class="accordion-body pt-3 pb-2 px-4" style="background-color: #fff8f0; border-bottom: 2px solid #e67e22;">
            <div class="d-flex align-items-start gap-2">
              <i class="bi bi-info-circle-fill text-orange" style="font-size: 1.2rem; margin-top: 0.1rem;"></i>
              <div class="flex-grow-1">
                <p class="mb-0 text-muted" style="line-height: 1.6;">${kat.beskrivning.replaceAll('\n', '<br>')}</p>
              </div>
            </div>
          </div>
        </div>` 
      : '';
    
    acc.innerHTML += `
      <div class="accordion-item">
        <h2 class="accordion-header" id="heading${i}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${i}" aria-expanded="false" aria-controls="collapse${i}">
            <span class="me-3 badge rounded-pill bg-orange fs-6 fw-bold" style="min-width:2.5rem;">${kat.nummer}</span>
            <span class="fs-5">${kat.namn}</span>
          </button>
        </h2>
        <div id="collapse${i}" class="accordion-collapse collapse" aria-labelledby="heading${i}" data-bs-parent="#accordionKategori">
          ${beskrivningHTML}
          <div class="accordion-body p-0">
            <ul class="list-group list-group-flush">${typerList}</ul>
          </div>
        </div>
      </div>`;
  });
}

// Visa typdetaljer i modal
function visaTypDetalj(katNamn, typNamn, el) {
  const kategori = window.kategorier.find(k => k.namn === katNamn);
  const typ = kategori.typer.find(t => t.namn === typNamn);
  // Hjälpfunktion för stapel
  function stapel(label, min, max, enhet, fargklass) {
    // Kontrollera om data saknas helt
    if (!min && !max) return '';
    if (min === '-' && max === '-') return '';
    if (min === '' && max === '') return '';
    
    let minVal = parseFloat((min || '0').replace(',', '.'));
    let maxVal = parseFloat((max || '0').replace(',', '.'));
    
    // Endast dölja om BÅDA värdena är NaN eller BÅDA är exakt 0
    if (isNaN(minVal) && isNaN(maxVal)) return '';
    if (minVal === 0 && maxVal === 0) return '';
    
    // Om bara max saknas men min finns, visa bara min-värdet utan stapel
    if ((isNaN(maxVal) || maxVal === 0) && minVal > 0) {
      const rowClass = label.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o');
      return `<div class="databar-row databar-row-${rowClass}">
        <span class="databar-label ${fargklass}">${label}</span>
        <div class="databar-bar">
          <span class="databar-min">${minVal}${enhet}+</span>
        </div>
      </div>`;
    }
    
    // Om ett värde är giltigt, använd det (sätt det andra till 0 om ogiltigt)
    if (isNaN(minVal)) minVal = 0;
    if (isNaN(maxVal)) maxVal = 0;
    
    // Beräkna intervallspann för att justera stapelbredd
    const spann = maxVal - minVal;
    let maxSpann;
    
    // Definiera typiska maxspann baserat på datan
    if (label === 'ABV') {
      maxSpann = 3.0; // Typiskt maxspann för ABV är ca 2-3%
    } else if (label === 'OG') {
      maxSpann = 0.040; // Typiskt maxspann för OG är ca 0.020-0.040
    } else if (label === 'FG') {
      maxSpann = 0.020; // Typiskt maxspann för FG är ca 0.010-0.020
    } else if (label === 'IBU') {
      maxSpann = 40; // Typiskt maxspann för IBU är ca 20-40
    } else if (label === 'Färg') {
      maxSpann = 60; // Typiskt maxspann för färg är ca 20-60 EBC
    } else {
      maxSpann = 1;
    }
    
    // Beräkna stapelbredd som procent av maxbredd (flex-grow värde)
    const flexGrow = Math.min(spann / maxSpann, 1);
    
    const rowClass = label.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o');
    return `<div class="databar-row databar-row-${rowClass}">
      <span class="databar-label ${fargklass}">${label}</span>
      <div class="databar-bar">
        <span class="databar-min">${minVal}${enhet}</span>
        <div class="databar-fill" style="flex-grow: ${flexGrow};"></div>
        <span class="databar-max">${maxVal}${enhet}</span>
      </div>
    </div>`;
  }

  // Funktion för att markera värdeord med fetstil
  function markeraVardeord(text) {
    if (!text) return text;
    // Markera "bör", "ska", "får" med fetstil (case-insensitive, hela ord)
    return text
      .replace(/\b(bör)\b/gi, '<strong>$1</strong>')
      .replace(/\b(ska)\b/gi, '<strong>$1</strong>')
      .replace(/\b(får)\b/gi, '<strong>$1</strong>');
  }

  // Rendera modalinnehåll från template
  const template = document.getElementById('typModalTemplate');
  const clone = template.content.cloneNode(true);
  clone.querySelector('[data-bokstav]').textContent = typ.bokstav;
  clone.querySelector('[data-namn]').textContent = typ.namn;
  clone.querySelector('[data-kategori]').textContent = `${typ.kategori} (${typ.kategoriNummer})`;
  clone.querySelector('[data-dataview]').innerHTML =
    stapel('ABV', typ.ABV_MIN, typ.ABV_MAX, '%', 'databar-abv') +
    stapel('OG', typ.OG_MIN, typ.OG_MAX, '', 'databar-og') +
    stapel('FG', typ.FG_MIN, typ.FG_MAX, '', 'databar-fg') +
    stapel('Färg', typ.COLOR_MIN, typ.COLOR_MAX, '', 'databar-color') +
    stapel('IBU', typ.IBU_MIN, typ.IBU_MAX, '', 'databar-ibu');
  clone.querySelector('[data-noter]').innerHTML = (typ.noter && typ.noter.trim() !== '') ? `<b>Beskrivning:</b><br><span>${markeraVardeord(typ.noter.replaceAll('\n', '<br>'))}</span>` : '';
  clone.querySelector('[data-profil]').innerHTML = (typ.profil && typ.profil.trim() !== '') ? `<b>Profil:</b><br><span>${markeraVardeord(typ.profil.replaceAll('\n', '<br>'))}</span>` : '';
  clone.querySelector('[data-exempel]').innerHTML = (typ.exempel && typ.exempel.trim() !== '') ? `<b>Exempel:</b><br><span>${typ.exempel.replaceAll('\n', '<br>')}</span>` : '';
  const container = document.getElementById('typDetaljer');
  container.innerHTML = '';
  container.appendChild(clone);
  const modal = new bootstrap.Modal(document.getElementById('typModal'));
  modal.show();
}
window.visaTypDetalj = visaTypDetalj;

// Sökfunktion
// Sökning: visa ENDAST träffade typer (stilar), inte kategorier
function filtreraKategorier(sokterm) {
  sokterm = sokterm.toLowerCase();
  if (!sokterm) return window.kategorier;
  // Samla alla typer som matchar
  const matchandeTyper = [];
  window.kategorier.forEach(kat => {
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


// Quiz-funktionalitet
let quizFrågor = [];
let quizSvar = [];
let quizIndex = 0;
let quizRätt = 0;
let quizVäntar = false; // För att förhindra flera klick under feedback

// Regelmotor för quiz-frågor
const quizRegler = {
  // Regler som filtrerar bort stilar innan de blir frågor
  stilFilter: [
    {
      namn: 'Exkludera övriga klassiska',
      beskrivning: 'Filtrera bort stilar från kategorier som innehåller "Övriga klassiska i kategori"',
      aktiv: true,
      test: (typ) => {
        // Returnera false för stilar som ska filtreras bort
        if (!typ.kategori) return true; // Behåll om kategori saknas
        return !typ.kategori.toLowerCase().includes('övriga klassiska i kategori');
      }
    }
  ],
  
  // Regler för textformatering i frågor
  textRegler: [
    {
      namn: 'Använd huvudklass/underklass terminologi',
      beskrivning: 'Ersätt "kategori" med "huvudklass" och "stil" med "underklass" i frågor',
      aktiv: true,
      formateraFraga: (fraga) => {
        return fraga
          .replace(/kategori/gi, (match) => {
            // Behåll versaler om originalet var versalt
            return match === 'Kategori' ? 'Huvudklass' : 'huvudklass';
          });
      },
      formateraFragetyp: (typ) => {
        return typ
          .replace(/kategori/gi, (match) => {
            return match === 'Kategori' ? 'Huvudklass' : 'huvudklass';
          })
          .replace(/ölstilen/gi, 'underklassen')
          .replace(/ölstil/gi, 'underklass')
          .replace(/stil/gi, 'underklass');
      }
    }
  ],
  
  // Applicera alla aktiva stilfilter
  filtreraStil: function(typ) {
    return this.stilFilter
      .filter(regel => regel.aktiv)
      .every(regel => regel.test(typ));
  },
  
  // Applicera alla aktiva textregler på en fråga
  formateraFragetext: function(fraga) {
    return this.textRegler
      .filter(regel => regel.aktiv && regel.formateraFraga)
      .reduce((text, regel) => regel.formateraFraga(text), fraga);
  },
  
  // Applicera alla aktiva textregler på en frågetyp
  formateraFragetyp: function(typ) {
    return this.textRegler
      .filter(regel => regel.aktiv && regel.formateraFragetyp)
      .reduce((text, regel) => regel.formateraFragetyp(text), typ);
  }
};

function startaQuiz() {
  // Skapa quizFrågor från en djup klon av window.kategorier så att quiz aldrig påverkar originaldata
  const kategorierKlon = JSON.parse(JSON.stringify(window.kategorier));
  quizFrågor = skapaQuizFrågor(kategorierKlon);
  quizSvar = new Array(10).fill(null); // Pre-allokera array för alla svar
  quizIndex = 0;
  quizRätt = 0;
  quizVäntar = false;
  visaQuizFråga();
  const modal = new bootstrap.Modal(document.getElementById('quizModal'));
  modal.show();
}

function skapaQuizFrågor(kategorier) {
  // Samla alla typer
  const allaTyper = [];
  kategorier.forEach(kat => kat.typer.forEach(typ => allaTyper.push(JSON.parse(JSON.stringify({ ...typ, kategori: kat.namn })))));
  
  // Filtrera bort stilar enligt regelmotorn
  const godkändaTyper = allaTyper.filter(typ => quizRegler.filtreraStil(typ));
  
  // Slumpa 10 olika frågor av olika typ
  const frågor = [];
  const shuffle = arr => arr.sort(() => Math.random() - 0.5);
  const valdaTyper = shuffle([...godkändaTyper]).slice(0, 15); // Ta lite fler för att säkerställa 10 giltiga
  
  // Hjälpfunktion för att kontrollera om två intervall överlappar
  function intervalOverlappar(min1, max1, min2, max2) {
    const n1 = parseFloat(min1.replace(',', '.'));
    const x1 = parseFloat(max1.replace(',', '.'));
    const n2 = parseFloat(min2.replace(',', '.'));
    const x2 = parseFloat(max2.replace(',', '.'));
    return !(x1 < n2 || x2 < n1); // Returnerar true om de överlappar
  }
  
  // Hjälpfunktion för att kontrollera om en stil har teknisk data
  function harTekniskData(typ) {
    const harOG = typ.OG_MIN && typ.OG_MAX && typ.OG_MIN !== '-' && typ.OG_MAX !== '-' && typ.OG_MIN !== '0' && typ.OG_MAX !== '0';
    const harFG = typ.FG_MIN && typ.FG_MAX && typ.FG_MIN !== '-' && typ.FG_MAX !== '-' && typ.FG_MIN !== '0' && typ.FG_MAX !== '0';
    const harABV = typ.ABV_MIN && typ.ABV_MAX && typ.ABV_MIN !== '-' && typ.ABV_MAX !== '-' && typ.ABV_MIN !== '0' && typ.ABV_MAX !== '0';
    const harIBU = typ.IBU_MIN && typ.IBU_MAX && typ.IBU_MIN !== '-' && typ.IBU_MAX !== '-' && typ.IBU_MIN !== '0' && typ.IBU_MAX !== '0';
    const harFärg = typ.COLOR_MIN && typ.COLOR_MAX && typ.COLOR_MIN !== '-' && typ.COLOR_MAX !== '-' && typ.COLOR_MIN !== '0' && typ.COLOR_MAX !== '0';
    
    return harOG || harFG || harABV || harIBU || harFärg;
  }

  valdaTyper.forEach(typ => {
      if (frågor.length >= 10) return; // Stoppa när vi har 10 frågor
      
      // Definiera vilka frågetyper som är tillgängliga för denna stil
      let frågetyper = [
        'Vilken kategori tillhör ölstilen',
        'Vilken är rätt profilbeskrivning?',
        'Vilket är ett exempel på denna stil?'
      ];
      
      // Lägg bara till tekniska datafrågor om stilen har teknisk data
      if (harTekniskData(typ)) {
        if (typ.OG_MIN && typ.OG_MAX && typ.OG_MIN !== '-' && typ.OG_MAX !== '-' && typ.OG_MIN !== '0' && typ.OG_MAX !== '0') {
          frågetyper.push('Vilket OG-intervall har ölstilen');
        }
        if (typ.IBU_MIN && typ.IBU_MAX && typ.IBU_MIN !== '-' && typ.IBU_MAX !== '-' && typ.IBU_MIN !== '0' && typ.IBU_MAX !== '0') {
          frågetyper.push('Vilket IBU-intervall har ölstilen');
        }
        if (typ.ABV_MIN && typ.ABV_MAX && typ.ABV_MIN !== '-' && typ.ABV_MAX !== '-' && typ.ABV_MIN !== '0' && typ.ABV_MAX !== '0') {
          frågetyper.push('Vilken alkoholhalt (ABV) har ölstilen');
        }
        if (typ.COLOR_MIN && typ.COLOR_MAX && typ.COLOR_MIN !== '-' && typ.COLOR_MAX !== '-' && typ.COLOR_MIN !== '0' && typ.COLOR_MAX !== '0') {
          frågetyper.push('Vilken färg har ölstilen');
        }
      }
      
      let typAv = shuffle(frågetyper)[0];
      let fråga = '', svar = '', alt = [];
      
      if (typAv === 'Vilken kategori tillhör ölstilen') {
        if (!typ.kategori) return;
        fråga = `Vilken kategori tillhör ölstilen <b>${typ.namn}</b>?`;
        svar = typ.kategori;
        alt = [typ.kategori, ...allaTyper.filter(t => t.kategori && t.kategori !== typ.kategori).map(t => t.kategori)];
      } else if (typAv === 'Vilket OG-intervall har ölstilen') {
        if (!typ.OG_MIN || !typ.OG_MAX || typ.OG_MIN === '-' || typ.OG_MAX === '-') return;
        fråga = `Vilket OG-intervall har <b>${typ.namn}</b>?`;
        svar = `${typ.OG_MIN} – ${typ.OG_MAX}`;
        // Filtrera bort intervall som överlappar med rätt svar
        alt = [svar];
        allaTyper.filter(t => t.namn !== typ.namn && t.OG_MIN && t.OG_MAX && t.OG_MIN !== '-' && t.OG_MAX !== '-')
          .forEach(t => {
            const altSvar = `${t.OG_MIN} – ${t.OG_MAX}`;
            if (!intervalOverlappar(typ.OG_MIN, typ.OG_MAX, t.OG_MIN, t.OG_MAX)) {
              alt.push(altSvar);
            }
          });
      } else if (typAv === 'Vilket IBU-intervall har ölstilen') {
        if (!typ.IBU_MIN || !typ.IBU_MAX || typ.IBU_MIN === '-' || typ.IBU_MAX === '-') return;
        fråga = `Vilket IBU-intervall har <b>${typ.namn}</b>?`;
        svar = `${typ.IBU_MIN} – ${typ.IBU_MAX}`;
        // Filtrera bort intervall som överlappar med rätt svar
        alt = [svar];
        allaTyper.filter(t => t.namn !== typ.namn && t.IBU_MIN && t.IBU_MAX && t.IBU_MIN !== '-' && t.IBU_MAX !== '-')
          .forEach(t => {
            const altSvar = `${t.IBU_MIN} – ${t.IBU_MAX}`;
            if (!intervalOverlappar(typ.IBU_MIN, typ.IBU_MAX, t.IBU_MIN, t.IBU_MAX)) {
              alt.push(altSvar);
            }
          });
      } else if (typAv === 'Vilken alkoholhalt (ABV) har ölstilen') {
        if (!typ.ABV_MIN || !typ.ABV_MAX || typ.ABV_MIN === '-' || typ.ABV_MAX === '-') return;
        fråga = `Vilket ABV-intervall har <b>${typ.namn}</b>?`;
        svar = `${typ.ABV_MIN} – ${typ.ABV_MAX} %`;
        // Filtrera bort intervall som överlappar med rätt svar
        alt = [svar];
        allaTyper.filter(t => t.namn !== typ.namn && t.ABV_MIN && t.ABV_MAX && t.ABV_MIN !== '-' && t.ABV_MAX !== '-')
          .forEach(t => {
            const altSvar = `${t.ABV_MIN} – ${t.ABV_MAX} %`;
            if (!intervalOverlappar(typ.ABV_MIN, typ.ABV_MAX, t.ABV_MIN, t.ABV_MAX)) {
              alt.push(altSvar);
            }
          });
      } else if (typAv === 'Vilken färg har ölstilen') {
        if (!typ.COLOR_MIN || !typ.COLOR_MAX || typ.COLOR_MIN === '-' || typ.COLOR_MAX === '-') return;
        fråga = `Vilket färgintervall har <b>${typ.namn}</b>?`;
        svar = `${typ.COLOR_MIN} – ${typ.COLOR_MAX}`;
        // Filtrera bort intervall som överlappar med rätt svar
        alt = [svar];
        allaTyper.filter(t => t.namn !== typ.namn && t.COLOR_MIN && t.COLOR_MAX && t.COLOR_MIN !== '-' && t.COLOR_MAX !== '-')
          .forEach(t => {
            const altSvar = `${t.COLOR_MIN} – ${t.COLOR_MAX}`;
            if (!intervalOverlappar(typ.COLOR_MIN, typ.COLOR_MAX, t.COLOR_MIN, t.COLOR_MAX)) {
              alt.push(altSvar);
            }
          });
      } else if (typAv === 'Vilken är rätt profilbeskrivning?') {
        if (!typ.profil || typ.profil.trim() === '') return;
        fråga = `Vilken är rätt profilbeskrivning för <b>${typ.namn}</b>?`;
        svar = typ.profil;
        alt = [svar, ...allaTyper.filter(t => t.namn !== typ.namn && t.profil && t.profil.trim() !== '').map(t => t.profil)];
      } else if (typAv === 'Vilket är ett exempel på denna stil?') {
        const exSvar = typ.exempel.split(/[;,\n]/)[0]?.trim() || '';
        if (!exSvar) return;
        fråga = `Vilket är ett exempel på <b>${typ.namn}</b>?`;
        svar = exSvar;
        alt = [svar, ...allaTyper.filter(t => t.namn !== typ.namn && t.exempel && t.exempel.trim() !== '').map(t => t.exempel.split(/[;,\n]/)[0]?.trim() || '')];
      }
      
      // Filtrera bort tomma och dubbletter
      alt = alt.filter(a => a && a.trim() !== '');
      alt = [...new Set(alt)];
      
      // VIKTIGT: Säkerställ att det rätta svaret alltid finns bland alternativen
      const rättSvarIndex = alt.indexOf(svar);
      if (rättSvarIndex === -1) {
        console.error('Rätt svar saknas i alternativ!', svar, alt);
        return; // Skippa denna fråga om rätt svar saknas
      }
      
      // Ta ut rätt svar först
      const rättSvar = alt[rättSvarIndex];
      const övrigaAlt = alt.filter(a => a !== rättSvar);
      
      // Blanda övriga alternativ och ta max 3
      const blandat = shuffle(övrigaAlt).slice(0, 3);
      
      // Sätt tillbaka rätt svar och blanda hela listan
      alt = shuffle([rättSvar, ...blandat]);
      
      if (alt.length < 2) return; // Skapa inte frågor med för få alternativ
      
      // Applicera textregler på fråga och frågetyp
      fråga = quizRegler.formateraFragetext(fråga);
      typAv = quizRegler.formateraFragetyp(typAv);
      
      frågor.push({ fråga, svar, alt, typAv });
  });
  return frågor.slice(0, 10); // Säkerställ att vi bara returnerar 10 frågor
}

function visaQuizFråga() {
  if (quizIndex >= quizFrågor.length) return visaQuizResultat();
  
  const q = quizFrågor[quizIndex];
  if (!q) return visaQuizResultat();
  
  // Applicera textregler på fråga och typ (om de inte redan är applicerade)
  const visadFraga = q.fråga; // Redan formaterad vid skapandet
  const visadTyp = q.typAv; // Redan formaterad vid skapandet
  
  let html = `<div class="text-center mb-4">
    <img src="assets/olstop-icon.svg" alt="Quiz" width="60" height="60" class="rounded-circle border border-2 border-orange mb-2" style="background:#fff;">
    <div class="fw-bold fs-5">Fråga ${quizIndex + 1} av ${quizFrågor.length}</div>
  </div>
  <div class="mb-3 fs-5">${visadFraga}</div>
  <div class="list-group mb-4" id="quizAlternativ">`;
  
  q.alt.forEach((alt, i) => {
    const isSelected = quizSvar[quizIndex] === alt;
    const isCorrect = alt === q.svar;
    let className = "list-group-item list-group-item-action py-3 quiz-alternativ";
    
    // Visa feedback om frågan redan är besvarad
    if (quizSvar[quizIndex] !== null) {
      if (isCorrect) {
        // Rätt svar visas alltid grönt
        className += " list-group-item-success fw-bold";
      } else if (isSelected && !isCorrect) {
        // Fel valt svar visas rött
        className += " list-group-item-danger fw-bold";
      }
      // Övriga alternativ förblir orörda (ingen extra klass)
    }
    
    html += `<button class="${className}" onclick="svaraQuiz(${i})" ${quizSvar[quizIndex] !== null ? 'disabled' : ''}>${alt}</button>`;
  });
  
  html += '</div>';
  
  // Navigeringsknappar
  html += `<div class="d-flex justify-content-between align-items-center mt-4">
    <button class="btn btn-secondary ${quizIndex === 0 ? 'disabled' : ''}" onclick="gaForegaendeFraga()" ${quizIndex === 0 ? 'disabled' : ''}>
      <i class="bi bi-arrow-left"></i> Föregående
    </button>
    <span class="text-muted">${visadTyp}</span>
    <button class="btn btn-orange ${quizIndex === quizFrågor.length - 1 ? 'disabled' : ''}" onclick="gaNastaFraga()" ${quizIndex === quizFrågor.length - 1 ? 'disabled' : ''}>
      Nästa <i class="bi bi-arrow-right"></i>
    </button>
  </div>`;
  
  // Visa knapp för att se resultat om alla frågor är besvarade
  const allaBesvarade = quizSvar.every(svar => svar !== null);
  if (allaBesvarade) {
    html += `<div class="text-center mt-3">
      <button class="btn btn-success btn-lg" onclick="visaQuizResultat()">
        <i class="bi bi-check-circle"></i> Se resultat
      </button>
    </div>`;
  }
  
  document.getElementById('quizContent').innerHTML = html;
}

function svaraQuiz(i) {
  if (quizVäntar || quizSvar[quizIndex] !== null) return; // Förhindra dubbelsvar
  
  const q = quizFrågor[quizIndex];
  const valt = q.alt[i];
  
  // Spara svaret
  quizSvar[quizIndex] = valt;
  
  // Visa feedback direkt
  const btns = document.querySelectorAll('#quizAlternativ button');
  btns.forEach((btn, idx) => {
    btn.disabled = true;
    
    // Hitta det rätta svaret och markera det grönt
    if (q.alt[idx] === q.svar) {
      btn.classList.add('list-group-item-success', 'fw-bold');
    }
    // Om användaren valde fel, markera det röd (men bara om det inte redan är rätt svar)
    else if (idx === i && q.alt[idx] !== q.svar) {
      btn.classList.add('list-group-item-danger', 'fw-bold');
    }
  });
  
  // Uppdatera navigering efter kort paus
  setTimeout(() => {
    visaQuizFråga();
  }, 800);
}

function gaForegaendeFraga() {
  if (quizIndex > 0) {
    quizIndex--;
    visaQuizFråga();
  }
}

function gaNastaFraga() {
  if (quizIndex < quizFrågor.length - 1) {
    quizIndex++;
    visaQuizFråga();
  }
}

// Globala funktioner
window.svaraQuiz = svaraQuiz;
window.gaForegaendeFraga = gaForegaendeFraga;
window.gaNastaFraga = gaNastaFraga;
window.visaQuizResultat = visaQuizResultat;
window.startaQuiz = startaQuiz;

function visaQuizResultat() {
  // Räkna rätt svar
  quizRätt = 0;
  quizFrågor.forEach((q, i) => {
    if (quizSvar[i] === q.svar) quizRätt++;
  });
  
  let html = `<div class="text-center mb-4">
    <img src="assets/olstop-icon.svg" alt="Quiz" width="70" height="70" class="rounded-circle border border-2 border-orange mb-2" style="background:#fff;">
    <div class="fw-bold fs-4 text-orange">Du fick ${quizRätt} av ${quizFrågor.length} rätt!</div>
  </div><hr>`;
  
  html += '<ol class="mt-4">';
  quizFrågor.forEach((q, i) => {
    const userSvar = quizSvar[i];
    html += `<li class="mb-3"><div class="mb-1">${q.fråga}</div>`;
    if (userSvar !== null) {
      html += `<div>Ditt svar: <b class="${userSvar === q.svar ? 'text-success' : 'text-danger'}">${userSvar}</b></div>`;
      if (userSvar !== q.svar) {
        html += `<div>Rätt svar: <b class="text-success">${q.svar}</b></div>`;
      }
    } else {
      html += `<div>Inte besvarat - Rätt svar: <b class="text-success">${q.svar}</b></div>`;
    }
    html += '</li>';
  });
  html += '</ol>';
  
  html += '<div class="text-center mt-4"><button class="btn btn-orange btn-lg" onclick="startaQuiz()">Försök igen</button></div>';
  document.getElementById('quizContent').innerHTML = html;
}

// Funktion för att generera ölnamn
function generateBeerName() {
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

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${randomAdjective} ${randomNoun}`;
}

document.addEventListener('DOMContentLoaded', async () => {

  let aktuellKalla = document.getElementById('kallaSelect').value || 'SHBF';
  let xml = await hamtaData(aktuellKalla);
  window.kategorier = parseBeerStyles(xml);
  renderAccordion(window.kategorier);

  // Byt källa vid val
  document.getElementById('kallaSelect').addEventListener('change', async e => {
    aktuellKalla = e.target.value;
    xml = await hamtaData(aktuellKalla);
    window.kategorier = parseBeerStyles(xml);
    renderAccordion(window.kategorier);
    document.getElementById('searchInput').value = '';
  });

  // Sök
  document.getElementById('searchInput').addEventListener('input', e => {
    const filtrerat = filtreraKategorier(e.target.value);
    renderAccordion(filtrerat);
  });

  // Quiz
  document.getElementById('quizBtn').addEventListener('click', startaQuiz);

  // Namngenerator
  document.getElementById('nameGenBtn').addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('nameGenModal'));
    document.getElementById('beerNameOutput').textContent = generateBeerName(); // Generate name immediately
    modal.show();
  });

  document.getElementById('generateNameBtn').addEventListener('click', () => {
    document.getElementById('beerNameOutput').textContent = generateBeerName();
  });

  // Theme toggler
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const htmlEl = document.documentElement;

  const savedTheme = 'light'; // Always start in light mode
  htmlEl.setAttribute('data-bs-theme', savedTheme);
  themeToggleBtn.querySelector('i').className = savedTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggleBtn.querySelector('i').className = newTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
  });
});
