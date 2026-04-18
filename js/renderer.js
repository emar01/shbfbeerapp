// renderer.js
// Ansvarar för att rendera UI-komponenter

/**
 * Rendera kategorier och typer i accordion
 * @param {Array} kategorier - Array av kategorier att visa
 */
export function renderAccordion(kategorier) {
  const acc = document.getElementById('accordionKategori');
  acc.innerHTML = '';
  
  // Om det bara finns en "kategori" och den heter Sökresultat, visa typ-listan direkt
  if (kategorier.length === 1 && kategorier[0].namn === 'Sökresultat') {
    renderSearchResults(kategorier[0], acc);
    return;
  }
  
  // Annars visa accordion som vanligt
  kategorier.forEach((kat, i) => {
    renderCategory(kat, i, acc);
  });
}

/**
 * Rendera sökresultat
 * @private
 */
function renderSearchResults(kategori, container) {
  const typerList = kategori.typer.map(typ => {
    const typKod = `${typ.kategoriNummer}${typ.bokstav}`;
    return `
      <li class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" style="cursor:pointer" onclick="visaTypDetalj('${typ.kategori.replace(/'/g, "\'")}', '${typ.namn.replace(/'/g, "\'")}', this)">
        <span class="badge rounded-pill bg-orange fs-6 fw-bold" style="min-width:2.5rem;">${typKod}</span>
        <span class="fw-semibold">${typ.namn}</span>
        <span class="text-muted ms-auto small">${typ.kategori}</span>
      </li>`;
  }).join('');
  container.innerHTML = `<div class="card mb-3"><div class="card-header bg-orange text-white fw-bold">Sökresultat</div><ul class="list-group list-group-flush">${typerList}</ul></div>`;
}

/**
 * Rendera en kategori i accordion
 * @private
 */
function renderCategory(kat, index, container) {
  // Sortera typer på bokstav A-Ö
  const sorteradeTyper = kat.typer.slice().sort((a, b) => a.bokstav.localeCompare(b.bokstav, 'sv'));
  const typerList = sorteradeTyper.map(typ => {
    const typKod = `${typ.kategoriNummer}${typ.bokstav}`;
    let badgeHTML = '';
    
    if (window.foregaendeKategorier && typ.persistentId) {
      let fannsTidigare = false;
      let andrad = false;
      for (const fKat of window.foregaendeKategorier) {
        const prevTyp = fKat.typer.find(t => t.persistentId === typ.persistentId);
        if (prevTyp) {
          fannsTidigare = true;
          if (
              typ.ABV_MIN !== prevTyp.ABV_MIN || typ.ABV_MAX !== prevTyp.ABV_MAX ||
              typ.OG_MIN !== prevTyp.OG_MIN || typ.OG_MAX !== prevTyp.OG_MAX ||
              typ.IBU_MIN !== prevTyp.IBU_MIN || typ.IBU_MAX !== prevTyp.IBU_MAX ||
              typ.FG_MIN !== prevTyp.FG_MIN || typ.FG_MAX !== prevTyp.FG_MAX ||
              typ.COLOR_MIN !== prevTyp.COLOR_MIN || typ.COLOR_MAX !== prevTyp.COLOR_MAX ||
              typ.namn !== prevTyp.namn || typ.beskrivning !== prevTyp.beskrivning
          ) {
            andrad = true;
          }
          break;
        }
      }
      if (!fannsTidigare) {
        badgeHTML = '<span class="badge bg-success ms-2" title="Helt ny stil i detta regelverk">Ny!</span>';
      } else if (andrad) {
        badgeHTML = `<span class="badge bg-warning text-dark ms-2" title="Uppdaterad från tidigare version">Uppdaterad</span>`;
      }
    }
    
    return `
      <li class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" style="cursor:pointer" onclick="visaTypDetalj('${kat.namn.replace(/'/g, "\\'")}', '${typ.namn.replace(/'/g, "\\'")}', this)">
        <span class="badge rounded-pill bg-orange fs-6 fw-bold" style="min-width:2.5rem;">${typKod}</span>
        <span class="fw-semibold">${typ.namn}${badgeHTML}</span>
      </li>`;
  }).join('');
  
  // Kategoribeskrivning om den finns - dold som standard
  const beskrivningHTML = kat.beskrivning && kat.beskrivning.trim() !== '' 
    ? `<div class="px-3 pt-2 pb-0">
        <button class="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2" 
                type="button" 
                data-bs-toggle="collapse" 
                data-bs-target="#beskrivning${index}" 
                aria-expanded="false" 
                aria-controls="beskrivning${index}">
          <i class="bi bi-info-circle"></i>
          <span>Om huvudklassen</span>
          <i class="bi bi-chevron-down ms-auto"></i>
        </button>
      </div>
      <div class="collapse" id="beskrivning${index}">
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
  
  container.innerHTML += `
    <div class="accordion-item">
      <h2 class="accordion-header" id="heading${index}">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="false" aria-controls="collapse${index}">
          <span class="me-3 badge rounded-pill bg-orange fs-6 fw-bold" style="min-width:2.5rem;">${kat.nummer}</span>
          <span class="fs-5">${kat.namn}</span>
        </button>
      </h2>
      <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}" data-bs-parent="#accordionKategori">
        ${beskrivningHTML}
        <div class="accordion-body p-0">
          <ul class="list-group list-group-flush">${typerList}</ul>
        </div>
      </div>
    </div>`;
}

/**
 * Visa typdetaljer i modal
 * @param {string} katNamn - Kategorinamn
 * @param {string} typNamn - Typnamn
 */
export function visaTypDetalj(katNamn, typNamn) {
  const kategori = window.kategorier.find(k => k.namn === katNamn);
  const typ = kategori.typer.find(t => t.namn === typNamn);
  
  let oldTyp = null;
  if (window.foregaendeKategorier && typ.persistentId) {
    for (const fKat of window.foregaendeKategorier) {
       oldTyp = fKat.typer.find(t => t.persistentId === typ.persistentId);
       if (oldTyp) break;
    }
  }
  
  // Rendera modalinnehåll från template
  const template = document.getElementById('typModalTemplate');
  const clone = template.content.cloneNode(true);
  clone.querySelector('[data-bokstav]').textContent = `${typ.kategoriNummer}${typ.bokstav}`;
  clone.querySelector('[data-namn]').textContent = typ.namn;
  clone.querySelector('[data-kategori]').textContent = typ.kategori;
  clone.querySelector('[data-dataview]').innerHTML = renderDataBars(typ, oldTyp);
  clone.querySelector('[data-noter]').innerHTML = renderNotes(typ, oldTyp);
  clone.querySelector('[data-profil]').innerHTML = renderProfile(typ.profil);
  clone.querySelector('[data-exempel]').innerHTML = renderExamples(typ.exempel);
  
  const container = document.getElementById('typDetaljer');
  container.innerHTML = '';
  container.appendChild(clone);
  const modal = new bootstrap.Modal(document.getElementById('typModal'));
  modal.show();
}

/**
 * Rendera datastaplar för teknisk data
 * @private
 */
function renderDataBars(typ, oldTyp = null) {
  return stapel('ABV', typ.ABV_MIN, typ.ABV_MAX, '%', 'databar-abv', oldTyp ? { min: oldTyp.ABV_MIN, max: oldTyp.ABV_MAX } : null) +
    stapel('OG', typ.OG_MIN, typ.OG_MAX, '', 'databar-og', oldTyp ? { min: oldTyp.OG_MIN, max: oldTyp.OG_MAX } : null) +
    stapel('FG', typ.FG_MIN, typ.FG_MAX, '', 'databar-fg', oldTyp ? { min: oldTyp.FG_MIN, max: oldTyp.FG_MAX } : null) +
    stapel('Färg', typ.COLOR_MIN, typ.COLOR_MAX, '', 'databar-color', oldTyp ? { min: oldTyp.COLOR_MIN, max: oldTyp.COLOR_MAX } : null) +
    stapel('IBU', typ.IBU_MIN, typ.IBU_MAX, '', 'databar-ibu', oldTyp ? { min: oldTyp.IBU_MIN, max: oldTyp.IBU_MAX } : null);
}

/**
 * Hjälpfunktion för att skapa en datastapel
 * @private
 */
function stapel(label, min, max, enhet, fargklass, oldData = null) {
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
  
  const spann = maxVal - minVal;
  const maxSpann = getMaxSpann(label);
  const flexGrow = Math.min(spann / maxSpann, 1);
  const rowClass = label.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o');
  
  let ghostHTML = '';
  if (oldData) {
    let oMin = parseFloat((oldData.min || '0').replace(',', '.'));
    let oMax = parseFloat((oldData.max || '0').replace(',', '.'));
    if (isNaN(oMin)) oMin = 0;
    if (isNaN(oMax)) oMax = 0;
    
    if (oMin !== minVal || oMax !== maxVal) {
      const oSpann = oMax - oMin;
      const oFlexGrow = Math.min(oSpann / maxSpann, 1);
      const ghostLabel = window.foregaendeVersionNamn ? `(${window.foregaendeVersionNamn})` : '(tidigare)';
      ghostHTML = `
      <div class="databar-row databar-row-${rowClass} mt-1 mb-2" style="opacity: 0.6; transform: scale(0.95); transform-origin: left center;">
        <span class="databar-label text-muted" style="font-size: 0.85em;">${ghostLabel}</span>
        <div class="databar-bar">
          <span class="databar-min text-danger text-decoration-line-through">${oMin}${enhet}</span>
          <div class="databar-fill bg-secondary" style="flex-grow: ${oFlexGrow}; border: 1px dashed #999;"></div>
          <span class="databar-max text-danger text-decoration-line-through">${oMax}${enhet}</span>
        </div>
      </div>`;
    }
  }

  return `<div class="databar-row databar-row-${rowClass}">
    <span class="databar-label ${fargklass}">${label}</span>
    <div class="databar-bar">
      <span class="databar-min text-success">${minVal}${enhet}</span>
      <div class="databar-fill" style="flex-grow: ${flexGrow};"></div>
      <span class="databar-max text-success">${maxVal}${enhet}</span>
    </div>
  </div>` + ghostHTML;
}

/**
 * Hämta typiskt maxspann för en datatyp
 * @private
 */
function getMaxSpann(label) {
  const maxSpannMap = {
    'ABV': 3.0,
    'OG': 0.040,
    'FG': 0.020,
    'IBU': 40,
    'Färg': 60
  };
  return maxSpannMap[label] || 1;
}

/**
 * Markera värdeord med fetstil
 * @private
 */
function markeraVardeord(text) {
  if (!text) return text;
  return text
    .replace(/\b(bör)\b/gi, '<strong>$1</strong>')
    .replace(/\b(ska)\b/gi, '<strong>$1</strong>')
    .replace(/\b(får)\b/gi, '<strong>$1</strong>');
}

/**
 * Rendera noter-sektion (inkl diff om den finns)
 * @private
 */
function renderNotes(typ, oldTyp = null) {
  let noter = typ.noter || '';
  let diffHTML = '';
  
  if (oldTyp && oldTyp.noter && oldTyp.noter.trim() !== noter.trim()) {
      diffHTML = `
      <div class="mt-4 p-3 rounded" style="background-color: #f8f9fa; border: 1px dashed #adb5bd;">
        <div class="text-muted fw-bold mb-1" style="font-size: 0.85em;">Tidigare beskrivning (${window.foregaendeVersionNamn}):</div>
        <div class="text-danger" style="font-size: 0.9em;">
           ${markeraVardeord(oldTyp.noter.replaceAll('\\n', '<br>'))}
        </div>
      </div>`;
  }

  return (noter.trim() !== '') 
    ? `<b>Beskrivning:</b><br><span class="${diffHTML ? 'mark d-block p-2 rounded' : ''}">${markeraVardeord(noter.replaceAll('\\n', '<br>'))}</span>${diffHTML}` 
    : '';
}

/**
 * Rendera profil-sektion
 * @private
 */
function renderProfile(profil) {
  return (profil && profil.trim() !== '') 
    ? `<b>Profil:</b><br><span>${markeraVardeord(profil.replaceAll('\n', '<br>'))}</span>` 
    : '';
}

/**
 * Rendera exempel-sektion
 * @private
 */
function renderExamples(exempel) {
  return (exempel && exempel.trim() !== '') 
    ? `<b>Exempel:</b><br><span>${exempel.replaceAll('\n', '<br>')}</span>` 
    : '';
}
