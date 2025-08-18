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
  const styleNodes = xml.querySelectorAll('STYLE');
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
  // Sortera kategorier på nummer, och typer på bokstav
  const kategorier = Object.values(kategorierMap)
    .sort((a, b) => Number(a.nummer) - Number(b.nummer))
    .map(kat => ({
      ...kat,
      typer: kat.typer.sort((a, b) => a.bokstav.localeCompare(b.bokstav, 'sv'))
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
      <li class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" style="cursor:pointer" onclick="visaTypDetalj('${typ.kategori.replace(/'/g, "\'")}', '${typ.namn.replace(/'/g, "\'")}', this)">
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
      <li class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" style="cursor:pointer" onclick="visaTypDetalj('${kat.namn.replace(/'/g, "\'")}', '${typ.namn.replace(/'/g, "\'")}', this)">
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
  const detaljer = `
    <div class="row g-4 align-items-center">
      <div class="col-md-5 text-center">
        <span class="badge rounded-pill bg-orange fs-3 px-4 py-2 mb-2">${typ.bokstav}</span>
        <h4 class="mb-2 mt-2">${typ.namn}</h4>
        <div class="text-muted mb-2">${typ.kategori} (${typ.kategoriNummer})</div>
        <table class="table table-sm table-bordered align-middle mb-3" style="background:#fff;">
          <tbody>
            <tr><th>OG</th><td>${typ.OG_MIN || '-'} – ${typ.OG_MAX || '-'}</td></tr>
            <tr><th>FG</th><td>${typ.FG_MIN || '-'} – ${typ.FG_MAX || '-'}</td></tr>
            <tr><th>ABV</th><td>${typ.ABV_MIN || '-'} – ${typ.ABV_MAX || '-'} %</td></tr>
            <tr><th>IBU</th><td>${typ.IBU_MIN || '-'} – ${typ.IBU_MAX || '-'}</td></tr>
            <tr><th>Färg</th><td>${typ.COLOR_MIN || '-'} – ${typ.COLOR_MAX || '-'}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="col-md-7">
        <div class="mb-3"><b>Noter:</b><br><span>${typ.noter.replaceAll('\n', '<br>')}</span></div>
        <div class="mb-3"><b>Profil:</b><br><span>${typ.profil.replaceAll('\n', '<br>')}</span></div>
        <div class="mb-3"><b>Exempel:</b><br><span>${typ.exempel.replaceAll('\n', '<br>')}</span></div>
      </div>
    </div>
  `;
  document.getElementById('typDetaljer').innerHTML = detaljer;
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
  quizFrågor = skapaQuizFrågor(window.kategorier);
  quizSvar = [];
  quizIndex = 0;
  quizRätt = 0;
  visaQuizFråga();
  const modal = new bootstrap.Modal(document.getElementById('quizModal'));
  modal.show();
}

function skapaQuizFrågor(kategorier) {
  // Samla alla typer
  const allaTyper = [];
  kategorier.forEach(kat => kat.typer.forEach(typ => allaTyper.push({ ...typ, kategori: kat.namn })));
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
      fråga = `Vilken kategori tillhör ölstilen <b>${typ.namn}</b>?`;
      svar = typ.kategori;
      alt = shuffle([typ.kategori, ...allaTyper.filter(t => t.kategori !== typ.kategori).map(t => t.kategori)]).slice(0, 4);
    } else if (typAv === 'Vilket OG-intervall har ölstilen') {
      fråga = `Vilket OG-intervall har <b>${typ.namn}</b>?`;
      svar = `${typ.OG_MIN} – ${typ.OG_MAX}`;
      alt = shuffle([svar, ...allaTyper.filter(t => t.namn !== typ.namn).map(t => `${t.OG_MIN} – ${t.OG_MAX}`)]).slice(0, 4);
    } else if (typAv === 'Vilket IBU-intervall har ölstilen') {
      fråga = `Vilket IBU-intervall har <b>${typ.namn}</b>?`;
      svar = `${typ.IBU_MIN} – ${typ.IBU_MAX}`;
      alt = shuffle([svar, ...allaTyper.filter(t => t.namn !== typ.namn).map(t => `${t.IBU_MIN} – ${t.IBU_MAX}`)]).slice(0, 4);
    } else if (typAv === 'Vilken alkoholhalt (ABV) har ölstilen') {
      fråga = `Vilket ABV-intervall har <b>${typ.namn}</b>?`;
      svar = `${typ.ABV_MIN} – ${typ.ABV_MAX} %`;
      alt = shuffle([svar, ...allaTyper.filter(t => t.namn !== typ.namn).map(t => `${t.ABV_MIN} – ${t.ABV_MAX} %`)]).slice(0, 4);
    } else if (typAv === 'Vilken färg har ölstilen') {
      fråga = `Vilket färgintervall har <b>${typ.namn}</b>?`;
      svar = `${typ.COLOR_MIN} – ${typ.COLOR_MAX}`;
      alt = shuffle([svar, ...allaTyper.filter(t => t.namn !== typ.namn).map(t => `${t.COLOR_MIN} – ${t.COLOR_MAX}`)]).slice(0, 4);
    } else if (typAv === 'Vilken är rätt profilbeskrivning?') {
      fråga = `Vilken är rätt profilbeskrivning för <b>${typ.namn}</b>?`;
      svar = typ.profil;
      alt = shuffle([svar, ...allaTyper.filter(t => t.namn !== typ.namn).map(t => t.profil)]).slice(0, 4);
    } else if (typAv === 'Vilket är ett exempel på denna stil?') {
      fråga = `Vilket är ett exempel på <b>${typ.namn}</b>?`;
      svar = typ.exempel.split(/[;,\n]/)[0] || typ.exempel;
      alt = shuffle([svar, ...allaTyper.filter(t => t.namn !== typ.namn).map(t => t.exempel.split(/[;,\n]/)[0] || t.exempel)]).slice(0, 4);
    }
    frågor.push({ fråga, svar, alt: shuffle(alt), typAv });
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
  <div class="list-group mb-4">`;
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
  quizIndex++;
  visaQuizFråga();
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

document.addEventListener('DOMContentLoaded', async () => {
  // Lägg till select/dropdown för källa
  const sourceDiv = document.createElement('div');
  sourceDiv.className = 'mb-3';
  sourceDiv.innerHTML = `
    <label for="kallaSelect" class="form-label fw-bold">Välj stilguidekälla:</label>
    <select id="kallaSelect" class="form-select" style="max-width:300px;display:inline-block">
      <option value="SHBF">SHBF</option>
      <option value="BJCP">BJCP</option>
    </select>
  `;
  const searchInput = document.getElementById('searchInput');
  searchInput.parentNode.insertBefore(sourceDiv, searchInput);

  let aktuellKalla = 'SHBF';
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
