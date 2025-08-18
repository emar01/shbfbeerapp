// app.js
// All kod på svenska

// Ladda och parsa valfri XML-fil (SHBF eller BJCP)
async function hamtaData(kalla = 'SHBF') {
  let url;
  if (kalla === 'SHBF') {
    url = 'https://raw.githubusercontent.com/emar01/shbfbeerapp/main/db/beerXML-generate.xml';
  } else if (kalla === 'BJCP') {
    url = 'https://raw.githubusercontent.com/emar01/shbfbeerapp/main/db/bjcp-beer-2021_en.xml';
  } else {
    throw new Error('Okänd källa');
  }
  const res = await fetch(url);
  const xmlText = await res.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  return xml;
}

// Extrahera och gruppera kategorier och typer ur XML enligt instruktionerna
function parseBeerStyles(xml) {
  const kategorierMap = {};
  // Försök först SHBF-struktur (STYLE)
  let styleNodes = xml.querySelectorAll('STYLE');
  if (styleNodes.length > 0) {
    styleNodes.forEach(style => {
      const kategoriNamn = style.querySelector('CATEGORY')?.textContent || '';
      const kategoriNummer = style.querySelector('CATEGORY_NUMBER')?.textContent || '';
      const kategoriKey = kategoriNummer + '|' + kategoriNamn;
      if (!kategorierMap[kategoriKey]) {
        kategorierMap[kategoriKey] = {
          namn: kategoriNamn,
          nummer: kategoriNummer,
          typer: []
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
    let categoryNodes = xml.querySelectorAll('category');
    categoryNodes.forEach(category => {
      const kategoriNummer = category.getAttribute('id') || '';
      const kategoriNamn = category.querySelector('name')?.textContent || '';
      const kategoriKey = kategoriNummer + '|' + kategoriNamn;
      if (!kategorierMap[kategoriKey]) {
        kategorierMap[kategoriKey] = {
          namn: kategoriNamn,
          nummer: kategoriNummer,
          typer: []
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
    const typerList = kategorier[0].typer.map(typ => `
      <li class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" style="cursor:pointer" onclick="visaTypDetalj('${typ.kategori.replace(/'/g, "'")}', '${typ.namn.replace(/'/g, "'")}', this)">
        <span class="badge rounded-pill bg-orange fs-6 fw-bold" style="min-width:2.5rem;">${typ.bokstav}</span>
        <span class="fw-semibold">${typ.namn}</span>
        <span class="text-muted ms-auto small">${typ.kategori}</span>
      </li>`).join('');
    acc.innerHTML = `<div class="card mb-3"><div class="card-header bg-orange text-white fw-bold">Sökresultat</div><ul class="list-group list-group-flush">${typerList}</ul></div>`;
    return;
  }
  // Annars visa accordion som vanligt
  kategorier.forEach((kat, i) => {
    const typerList = kat.typer.map(typ => `
      <li class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" style="cursor:pointer" onclick="visaTypDetalj('${kat.namn.replace(/'/g, "'")}', '${typ.namn.replace(/'/g, "'")}', this)">
        <span class="badge rounded-pill bg-orange fs-6 fw-bold" style="min-width:2.5rem;">${typ.bokstav}</span>
        <span class="fw-semibold">${typ.namn}</span>
      </li>`).join('');
    acc.innerHTML += `
      <div class="accordion-item">
        <h2 class="accordion-header" id="heading${i}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${i}" aria-expanded="false" aria-controls="collapse${i}">
            <span class="me-3 badge rounded-pill bg-orange fs-6 fw-bold" style="min-width:2.5rem;">${kat.nummer}</span>
            <span class="fs-5">${kat.namn}</span>
          </button>
        </h2>
        <div id="collapse${i}" class="accordion-collapse collapse" aria-labelledby="heading${i}" data-bs-parent="#accordionKategori">
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
    if (!min && !max) return '';
    let minVal = parseFloat(min.replace(',', '.'));
    let maxVal = parseFloat(max.replace(',', '.'));
    if (isNaN(minVal) || isNaN(maxVal)) return '';
    let minPos = 0;
    let maxPos = 100;
    return `<div class="databar-row">
      <span class="databar-label ${fargklass}">${label}</span>
      <div class="databar-bar">
        <div class="databar-fill" style="left:${minPos}%;width:${maxPos-minPos}%;"></div>
        <span class="databar-min">${minVal}${enhet}</span>
        <span class="databar-max">${maxVal}${enhet}</span>
      </div>
    </div>`;
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
  clone.querySelector('[data-noter]').innerHTML = (typ.noter && typ.noter.trim() !== '') ? `<b>Beskrivning:</b><br><span>${typ.noter.replaceAll('\n', '<br>')}</span>` : '';
  clone.querySelector('[data-profil]').innerHTML = (typ.profil && typ.profil.trim() !== '') ? `<b>Profil:</b><br><span>${typ.profil.replaceAll('\n', '<br>')}</span>` : '';
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
  // Visa alla träffade typer i en "kategori" (sökresultat)
  if (matchandeTyper.length > 0) {
    return [{
      namn: 'Sökresultat',
      nummer: '',
      typer: matchandeTyper
    }];
  }
  return [];
}


// Quiz-funktionalitet
let quizFrågor = [];
let quizSvar = [];
let quizIndex = 0;
let quizRätt = 0;

function startaQuiz() {
  // Skapa quizFrågor från en djup klon av window.kategorier så att quiz aldrig påverkar originaldata
  const kategorierKlon = JSON.parse(JSON.stringify(window.kategorier));
  quizFrågor = skapaQuizFrågor(kategorierKlon);
  quizSvar = [];
  quizIndex = 0;
  quizRätt = 0;
  visaQuizFråga();
  const modal = new bootstrap.Modal(document.getElementById('quizModal'));
  modal.show();
}

function skapaQuizFrågor(kategorier) {
  // Samla alla typer
  // Gör en djup kopia av kategorier och typer för quiz så att window.kategorier inte påverkas
  const allaTyper = [];
  kategorier.forEach(kat => kat.typer.forEach(typ => allaTyper.push(JSON.parse(JSON.stringify({ ...typ, kategori: kat.namn })))));
  // Slumpa 10 olika frågor av olika typ
  const frågor = [];
  const shuffle = arr => arr.sort(() => Math.random() - 0.5);
  const valdaTyper = shuffle([...allaTyper]).slice(0, 10);
  valdaTyper.forEach(typ => {
      // Välj frågetyp slumpmässigt
      const frågetyper = [
        'Vilken kategori tillhör ölstilen',
        'Vilket OG-intervall har ölstilen',
        'Vilket IBU-intervall har ölstilen',
        'Vilken alkoholhalt (ABV) har ölstilen',
        'Vilken färg har ölstilen',
        'Vilken är rätt profilbeskrivning?',
        'Vilket är ett exempel på denna stil?'
      ];
      const typAv = shuffle(frågetyper)[0];
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
        alt = [svar, ...allaTyper.filter(t => t.namn !== typ.namn && t.OG_MIN && t.OG_MAX && t.OG_MIN !== '-' && t.OG_MAX !== '-').map(t => `${t.OG_MIN} – ${t.OG_MAX}`)];
      } else if (typAv === 'Vilket IBU-intervall har ölstilen') {
        if (!typ.IBU_MIN || !typ.IBU_MAX || typ.IBU_MIN === '-' || typ.IBU_MAX === '-') return;
        fråga = `Vilket IBU-intervall har <b>${typ.namn}</b>?`;
        svar = `${typ.IBU_MIN} – ${typ.IBU_MAX}`;
        alt = [svar, ...allaTyper.filter(t => t.namn !== typ.namn && t.IBU_MIN && t.IBU_MAX && t.IBU_MIN !== '-' && t.IBU_MAX !== '-').map(t => `${t.IBU_MIN} – ${t.IBU_MAX}`)];
      } else if (typAv === 'Vilken alkoholhalt (ABV) har ölstilen') {
        if (!typ.ABV_MIN || !typ.ABV_MAX || typ.ABV_MIN === '-' || typ.ABV_MAX === '-') return;
        fråga = `Vilket ABV-intervall har <b>${typ.namn}</b>?`;
        svar = `${typ.ABV_MIN} – ${typ.ABV_MAX} %`;
        alt = [svar, ...allaTyper.filter(t => t.namn !== typ.namn && t.ABV_MIN && t.ABV_MAX && t.ABV_MIN !== '-' && t.ABV_MAX !== '-').map(t => `${t.ABV_MIN} – ${t.ABV_MAX} %`)];
      } else if (typAv === 'Vilken färg har ölstilen') {
        if (!typ.COLOR_MIN || !typ.COLOR_MAX || typ.COLOR_MIN === '-' || typ.COLOR_MAX === '-') return;
        fråga = `Vilket färgintervall har <b>${typ.namn}</b>?`;
        svar = `${typ.COLOR_MIN} – ${typ.COLOR_MAX}`;
        alt = [svar, ...allaTyper.filter(t => t.namn !== typ.namn && t.COLOR_MIN && t.COLOR_MAX && t.COLOR_MIN !== '-' && t.COLOR_MAX !== '-').map(t => `${t.COLOR_MIN} – ${t.COLOR_MAX}`)];
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
      // Ta max 4 unika alternativ och blanda dem
      alt = shuffle(alt).slice(0, 4);
      if (alt.length < 2) return; // Skapa inte frågor med för få alternativ
      frågor.push({ fråga, svar, alt, typAv });
  });
  return frågor;
}

function visaQuizFråga() {
  const q = quizFrågor[quizIndex];
  if (!q) return visaQuizResultat();
  let html = `<div class="text-center mb-4">
    <img src="../assets/quiz2.jpeg" alt="Quiz" width="60" height="60" class="rounded-circle border border-2 border-orange mb-2" style="background:#fff;">
    <div class="fw-bold fs-5">Fråga ${quizIndex + 1} av 10</div>
  </div>
  <div class="mb-3 fs-5">${q.fråga}</div>
  <div class="list-group mb-4" id="quizAlternativ">`;
  q.alt.forEach((alt, i) => {
    html += `<button class="list-group-item list-group-item-action py-3" onclick="svaraQuiz(${i})">${alt}</button>`;
  });
  html += '</div>';
  html += `<div class="text-end"><span class="text-muted">${q.typAv}</span></div>`;
  document.getElementById('quizContent').innerHTML = html;
}

function svaraQuiz(i) {
  const q = quizFrågor[quizIndex];
  const valt = q.alt[i];
  quizSvar.push({ fråga: q.fråga, rätt: q.svar, valt });
  if (valt === q.svar) quizRätt++;
  // Visa feedback direkt
  const btns = document.querySelectorAll('#quizAlternativ button');
  btns.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === i && q.alt[idx] === q.svar) {
      btn.classList.add('list-group-item-success');
    } else if (idx === i && q.alt[idx] !== q.svar) {
      btn.classList.add('list-group-item-danger');
    }
  });
  setTimeout(() => {
    quizIndex++;
    visaQuizFråga();
  }, 1200);
}

function visaQuizResultat() {
  let html = `<div class="text-center mb-4">
    <img src="../assets/quiz.jpeg" alt="Quiz" width="70" height="70" class="rounded-circle border border-2 border-orange mb-2" style="background:#fff;">
    <div class="fw-bold fs-4 text-orange">Du fick ${quizRätt} av 10 rätt!</div>
  </div><hr>`;
  html += '<ol class="mt-4">';
  quizSvar.forEach((s, i) => {
    html += `<li class="mb-3"><div class="mb-1">${s.fråga}</div>`;
    html += `<div>Ditt svar: <b class="${s.valt === s.rätt ? 'text-success' : 'text-danger'}">${s.valt}</b></div>`;
    if (s.valt !== s.rätt) html += `<div>Rätt svar: <b class="text-success">${s.rätt}</b></div>`;
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
