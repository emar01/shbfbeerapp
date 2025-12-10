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
      <li class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" style="cursor:pointer" onclick="visaTypDetalj('${typ.kategori.replace(/'/g, "'")}', '${typ.namn.replace(/'/g, "'")}', this)">
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
  
  // Rendera modalinnehåll från template
  const template = document.getElementById('typModalTemplate');
  const clone = template.content.cloneNode(true);
  clone.querySelector('[data-bokstav]').textContent = typ.bokstav;
  clone.querySelector('[data-namn]').textContent = typ.namn;
  clone.querySelector('[data-kategori]').textContent = `${typ.kategori} (${typ.kategoriNummer})`;
  clone.querySelector('[data-dataview]').innerHTML = renderDataBars(typ);
  clone.querySelector('[data-noter]').innerHTML = renderNotes(typ.noter);
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
function renderDataBars(typ) {
  return stapel('ABV', typ.ABV_MIN, typ.ABV_MAX, '%', 'databar-abv') +
    stapel('OG', typ.OG_MIN, typ.OG_MAX, '', 'databar-og') +
    stapel('FG', typ.FG_MIN, typ.FG_MAX, '', 'databar-fg') +
    stapel('Färg', typ.COLOR_MIN, typ.COLOR_MAX, '', 'databar-color') +
    stapel('IBU', typ.IBU_MIN, typ.IBU_MAX, '', 'databar-ibu');
}

/**
 * Hjälpfunktion för att skapa en datastapel
 * @private
 */
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
  const maxSpann = getMaxSpann(label);
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
 * Rendera noter-sektion
 * @private
 */
function renderNotes(noter) {
  return (noter && noter.trim() !== '') 
    ? `<b>Beskrivning:</b><br><span>${markeraVardeord(noter.replaceAll('\n', '<br>'))}</span>` 
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
