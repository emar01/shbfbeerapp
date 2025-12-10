// quiz.js
// Ansvarar för quiz-funktionalitet

// Quiz state
let quizFrågor = [];
let quizSvar = [];
let quizIndex = 0;
let quizRätt = 0;
let quizVäntar = false;

// Regelmotor för quiz-frågor
const quizRegler = {
  // Regler som filtrerar bort stilar innan de blir frågor
  stilFilter: [
    {
      namn: 'Exkludera övriga klassiska',
      beskrivning: 'Filtrera bort stilar från kategorier som innehåller "Övriga klassiska i kategori"',
      aktiv: true,
      test: (typ) => {
        if (!typ.kategori) return true;
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
        return fraga.replace(/kategori/gi, (match) => {
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

/**
 * Starta quiz
 */
export function startaQuiz() {
  const kategorierKlon = JSON.parse(JSON.stringify(window.kategorier));
  quizFrågor = skapaQuizFrågor(kategorierKlon);
  quizSvar = new Array(10).fill(null);
  quizIndex = 0;
  quizRätt = 0;
  quizVäntar = false;
  visaQuizFråga();
  const modal = new bootstrap.Modal(document.getElementById('quizModal'));
  modal.show();
}

/**
 * Skapa quiz-frågor från kategorier
 * @private
 */
function skapaQuizFrågor(kategorier) {
  const allaTyper = [];
  kategorier.forEach(kat => kat.typer.forEach(typ => allaTyper.push(JSON.parse(JSON.stringify({ ...typ, kategori: kat.namn })))));
  
  const godkändaTyper = allaTyper.filter(typ => quizRegler.filtreraStil(typ));
  
  const frågor = [];
  const shuffle = arr => arr.sort(() => Math.random() - 0.5);
  const valdaTyper = shuffle([...godkändaTyper]).slice(0, 15);
  
  valdaTyper.forEach(typ => {
    if (frågor.length >= 10) return;
    
    const fraga = skapaFraga(typ, allaTyper, shuffle);
    if (fraga) {
      frågor.push(fraga);
    }
  });
  
  return frågor.slice(0, 10);
}

/**
 * Skapa en fråga baserad på en typ
 * @private
 */
function skapaFraga(typ, allaTyper, shuffle) {
  let frågetyper = [
    'Vilken kategori tillhör ölstilen',
    'Vilken är rätt profilbeskrivning?',
    'Vilket är ett exempel på denna stil?'
  ];
  
  if (harTekniskData(typ)) {
    if (harGiltigData(typ.OG_MIN, typ.OG_MAX)) {
      frågetyper.push('Vilket OG-intervall har ölstilen');
    }
    if (harGiltigData(typ.IBU_MIN, typ.IBU_MAX)) {
      frågetyper.push('Vilket IBU-intervall har ölstilen');
    }
    if (harGiltigData(typ.ABV_MIN, typ.ABV_MAX)) {
      frågetyper.push('Vilken alkoholhalt (ABV) har ölstilen');
    }
    if (harGiltigData(typ.COLOR_MIN, typ.COLOR_MAX)) {
      frågetyper.push('Vilken färg har ölstilen');
    }
  }
  
  const typAv = shuffle(frågetyper)[0];
  const fragaData = byggFraga(typAv, typ, allaTyper, shuffle);
  
  if (!fragaData) return null;
  
  let { fråga, svar, alt } = fragaData;
  
  alt = alt.filter(a => a && a.trim() !== '');
  alt = [...new Set(alt)];
  
  const rättSvarIndex = alt.indexOf(svar);
  if (rättSvarIndex === -1) {
    console.error('Rätt svar saknas i alternativ!', svar, alt);
    return null;
  }
  
  const rättSvar = alt[rättSvarIndex];
  const övrigaAlt = alt.filter(a => a !== rättSvar);
  const blandat = shuffle(övrigaAlt).slice(0, 3);
  alt = shuffle([rättSvar, ...blandat]);
  
  if (alt.length < 2) return null;
  
  fråga = quizRegler.formateraFragetext(fråga);
  const formateradTyp = quizRegler.formateraFragetyp(typAv);
  
  return { fråga, svar, alt, typAv: formateradTyp };
}

/**
 * Kontrollera om en typ har teknisk data
 * @private
 */
function harTekniskData(typ) {
  return harGiltigData(typ.OG_MIN, typ.OG_MAX) ||
    harGiltigData(typ.FG_MIN, typ.FG_MAX) ||
    harGiltigData(typ.ABV_MIN, typ.ABV_MAX) ||
    harGiltigData(typ.IBU_MIN, typ.IBU_MAX) ||
    harGiltigData(typ.COLOR_MIN, typ.COLOR_MAX);
}

/**
 * Kontrollera om data är giltig
 * @private
 */
function harGiltigData(min, max) {
  return min && max && min !== '-' && max !== '-' && min !== '0' && max !== '0';
}

/**
 * Bygg en fråga baserat på frågetyp
 * @private
 */
function byggFraga(typAv, typ, allaTyper, shuffle) {
  let fråga = '', svar = '', alt = [];
  
  if (typAv === 'Vilken kategori tillhör ölstilen') {
    if (!typ.kategori) return null;
    fråga = `Vilken kategori tillhör ölstilen <b>${typ.namn}</b>?`;
    svar = typ.kategori;
    alt = [typ.kategori, ...allaTyper.filter(t => t.kategori && t.kategori !== typ.kategori).map(t => t.kategori)];
  } else if (typAv.includes('OG-intervall')) {
    return byggIntervallFraga('OG', typ, allaTyper, 'OG_MIN', 'OG_MAX');
  } else if (typAv.includes('IBU-intervall')) {
    return byggIntervallFraga('IBU', typ, allaTyper, 'IBU_MIN', 'IBU_MAX');
  } else if (typAv.includes('alkoholhalt')) {
    return byggIntervallFraga('ABV', typ, allaTyper, 'ABV_MIN', 'ABV_MAX', '%');
  } else if (typAv.includes('färg')) {
    return byggIntervallFraga('färgintervall', typ, allaTyper, 'COLOR_MIN', 'COLOR_MAX');
  } else if (typAv.includes('profilbeskrivning')) {
    if (!typ.profil || typ.profil.trim() === '') return null;
    fråga = `Vilken är rätt profilbeskrivning för <b>${typ.namn}</b>?`;
    svar = typ.profil;
    alt = [svar, ...allaTyper.filter(t => t.namn !== typ.namn && t.profil && t.profil.trim() !== '').map(t => t.profil)];
  } else if (typAv.includes('exempel')) {
    const exSvar = typ.exempel.split(/[;,\n]/)[0]?.trim() || '';
    if (!exSvar) return null;
    fråga = `Vilket är ett exempel på <b>${typ.namn}</b>?`;
    svar = exSvar;
    alt = [svar, ...allaTyper.filter(t => t.namn !== typ.namn && t.exempel && t.exempel.trim() !== '').map(t => t.exempel.split(/[;,\n]/)[0]?.trim() || '')];
  }
  
  return { fråga, svar, alt };
}

/**
 * Bygg intervallfråga
 * @private
 */
function byggIntervallFraga(label, typ, allaTyper, minProp, maxProp, enhet = '') {
  if (!harGiltigData(typ[minProp], typ[maxProp])) return null;
  const fråga = `Vilket ${label}-intervall har <b>${typ.namn}</b>?`;
  const enhetsuffix = enhet ? ` ${enhet}` : '';
  const svar = `${typ[minProp]} – ${typ[maxProp]}${enhetsuffix}`;
  
  const alt = [svar];
  allaTyper.filter(t => t.namn !== typ.namn && harGiltigData(t[minProp], t[maxProp]))
    .forEach(t => {
      const altSvar = `${t[minProp]} – ${t[maxProp]}${enhetsuffix}`;
      if (!intervalOverlappar(typ[minProp], typ[maxProp], t[minProp], t[maxProp])) {
        alt.push(altSvar);
      }
    });
  
  return { fråga, svar, alt };
}

/**
 * Kontrollera om två intervall överlappar
 * @private
 */
function intervalOverlappar(min1, max1, min2, max2) {
  const n1 = parseFloat(min1.replace(',', '.'));
  const x1 = parseFloat(max1.replace(',', '.'));
  const n2 = parseFloat(min2.replace(',', '.'));
  const x2 = parseFloat(max2.replace(',', '.'));
  return !(x1 < n2 || x2 < n1);
}

/**
 * Visa quiz-fråga
 */
function visaQuizFråga() {
  if (quizIndex >= quizFrågor.length) return visaQuizResultat();
  
  const q = quizFrågor[quizIndex];
  if (!q) return visaQuizResultat();
  
  let html = renderQuizHeader();
  html += renderQuizQuestion(q);
  html += renderQuizNavigation();
  html += renderQuizResultButton();
  
  document.getElementById('quizContent').innerHTML = html;
}

/**
 * Rendera quiz-header
 * @private
 */
function renderQuizHeader() {
  return `<div class="text-center mb-4">
    <img src="assets/olstop-icon.svg" alt="Quiz" width="60" height="60" class="rounded-circle border border-2 border-orange mb-2" style="background:#fff;">
    <div class="fw-bold fs-5">Fråga ${quizIndex + 1} av ${quizFrågor.length}</div>
  </div>`;
}

/**
 * Rendera quiz-fråga
 * @private
 */
function renderQuizQuestion(q) {
  let html = `<div class="mb-3 fs-5">${q.fråga}</div>
  <div class="list-group mb-4" id="quizAlternativ">`;
  
  q.alt.forEach((alt, i) => {
    const isSelected = quizSvar[quizIndex] === alt;
    const isCorrect = alt === q.svar;
    let className = "list-group-item list-group-item-action py-3 quiz-alternativ";
    
    if (quizSvar[quizIndex] !== null) {
      if (isCorrect) {
        className += " list-group-item-success fw-bold";
      } else if (isSelected && !isCorrect) {
        className += " list-group-item-danger fw-bold";
      }
    }
    
    html += `<button class="${className}" onclick="svaraQuiz(${i})" ${quizSvar[quizIndex] !== null ? 'disabled' : ''}>${alt}</button>`;
  });
  
  html += '</div>';
  return html;
}

/**
 * Rendera quiz-navigering
 * @private
 */
function renderQuizNavigation() {
  const q = quizFrågor[quizIndex];
  return `<div class="d-flex justify-content-between align-items-center mt-4">
    <button class="btn btn-secondary ${quizIndex === 0 ? 'disabled' : ''}" onclick="gaForegaendeFraga()" ${quizIndex === 0 ? 'disabled' : ''}>
      <i class="bi bi-arrow-left"></i> Föregående
    </button>
    <span class="text-muted">${q.typAv}</span>
    <button class="btn btn-orange ${quizIndex === quizFrågor.length - 1 ? 'disabled' : ''}" onclick="gaNastaFraga()" ${quizIndex === quizFrågor.length - 1 ? 'disabled' : ''}>
      Nästa <i class="bi bi-arrow-right"></i>
    </button>
  </div>`;
}

/**
 * Rendera resultatknapp om alla frågor är besvarade
 * @private
 */
function renderQuizResultButton() {
  const allaBesvarade = quizSvar.every(svar => svar !== null);
  if (allaBesvarade) {
    return `<div class="text-center mt-3">
      <button class="btn btn-success btn-lg" onclick="visaQuizResultat()">
        <i class="bi bi-check-circle"></i> Se resultat
      </button>
    </div>`;
  }
  return '';
}

/**
 * Svara på quiz-fråga
 * @param {number} i - Index för valt alternativ
 */
export function svaraQuiz(i) {
  if (quizVäntar || quizSvar[quizIndex] !== null) return;
  
  const q = quizFrågor[quizIndex];
  const valt = q.alt[i];
  quizSvar[quizIndex] = valt;
  
  const btns = document.querySelectorAll('#quizAlternativ button');
  btns.forEach((btn, idx) => {
    btn.disabled = true;
    if (q.alt[idx] === q.svar) {
      btn.classList.add('list-group-item-success', 'fw-bold');
    } else if (idx === i && q.alt[idx] !== q.svar) {
      btn.classList.add('list-group-item-danger', 'fw-bold');
    }
  });
  
  setTimeout(() => {
    visaQuizFråga();
  }, 800);
}

/**
 * Gå till föregående fråga
 */
export function gaForegaendeFraga() {
  if (quizIndex > 0) {
    quizIndex--;
    visaQuizFråga();
  }
}

/**
 * Gå till nästa fråga
 */
export function gaNastaFraga() {
  if (quizIndex < quizFrågor.length - 1) {
    quizIndex++;
    visaQuizFråga();
  }
}

/**
 * Visa quiz-resultat
 */
export function visaQuizResultat() {
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
