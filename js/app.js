// app.js
// Huvudapplikation - ansvarar för initialisering och koordinering av moduler

import { hamtaData, hamtaIndex } from './api.js?v=2';
import { parseBeerStyles } from './parser.js?v=2';
import { renderAccordion, visaTypDetalj } from './renderer.js?v=2';
import { filtreraKategorier } from './search.js?v=2';
import { startaQuiz, svaraQuiz, gaForegaendeFraga, gaNastaFraga, visaQuizResultat } from './quiz.js?v=2';
import { generateBeerName } from './nameGenerator.js?v=2';
import { initTheme } from './theme.js?v=2';

// Exponera funktioner till globalt scope för onclick-handlers
window.visaTypDetalj = visaTypDetalj;
window.startaQuiz = startaQuiz;
window.svaraQuiz = svaraQuiz;
window.gaForegaendeFraga = gaForegaendeFraga;
window.gaNastaFraga = gaNastaFraga;
window.visaQuizResultat = visaQuizResultat;

// Initiera applikation när DOM är laddad
document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
});

/**
 * Initiera applikation
 */
async function initApp() {
  // Ladda initial data
  let aktuellKalla = document.getElementById('kallaSelect').value || 'SHBF';
  window.aktuellVersion = '';
  
  if (aktuellKalla === 'SHBF') {
    const indexData = await hamtaIndex();
    if (indexData && indexData.length > 0) {
      // Sortera med nyaste överst, säkra typen till sträng
      window.shbfIndex = indexData.sort((a, b) => String(b.name).localeCompare(String(a.name)));
      const valjare = document.getElementById('versionSelect');
      valjare.innerHTML = window.shbfIndex.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
      window.aktuellVersion = window.shbfIndex[0].name;
      document.getElementById('versionContainer').style.display = 'block';
    }
  } else {
    document.getElementById('versionContainer').style.display = 'none';
  }

  let data = await hamtaData(aktuellKalla, window.aktuellVersion);
  window.kategorier = parseBeerStyles(data);
  
  // Ladda föregående version för diff-beräkning om möjligt
  await laddaForegaendeVersion(window.aktuellVersion);

  renderAccordion(window.kategorier);

  // Registrera event listeners
  registerEventListeners(aktuellKalla);
  
  // Initiera tema
  initTheme();

  // Registrera Service Worker för PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }
}

/**
 * Registrera alla event listeners
 */
function registerEventListeners(aktuellKalla) {
  // Byt källa vid val
  document.getElementById('kallaSelect').addEventListener('change', async (e) => {
    aktuellKalla = e.target.value;
    if (aktuellKalla === 'SHBF' && window.shbfIndex) {
      document.getElementById('versionContainer').style.display = 'block';
      window.aktuellVersion = document.getElementById('versionSelect').value;
    } else {
      document.getElementById('versionContainer').style.display = 'none';
      window.aktuellVersion = '';
    }
    const data = await hamtaData(aktuellKalla, window.aktuellVersion);
    window.kategorier = parseBeerStyles(data);
    await laddaForegaendeVersion(window.aktuellVersion);
    renderAccordion(window.kategorier);
    document.getElementById('searchInput').value = '';
  });

  // Byt version
  document.getElementById('versionSelect').addEventListener('change', async (e) => {
    window.aktuellVersion = e.target.value;
    const data = await hamtaData('SHBF', window.aktuellVersion);
    window.kategorier = parseBeerStyles(data);
    await laddaForegaendeVersion(window.aktuellVersion);
    renderAccordion(window.kategorier);
    document.getElementById('searchInput').value = '';
  });

  // Sök
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const filtrerat = filtreraKategorier(e.target.value, window.kategorier);
    renderAccordion(filtrerat);
  });

  // Quiz
  document.getElementById('quizBtn').addEventListener('click', startaQuiz);

  // Namngenerator
  document.getElementById('nameGenBtn').addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('nameGenModal'));
    document.getElementById('beerNameOutput').textContent = generateBeerName();
    modal.show();
  });

  document.getElementById('generateNameBtn').addEventListener('click', () => {
    document.getElementById('beerNameOutput').textContent = generateBeerName();
  });
}

/**
 * Laddar föregående version av SHBF för diffing
 */
async function laddaForegaendeVersion(currentVersionName) {
  window.foregaendeKategorier = null;
  if (!window.shbfIndex || !currentVersionName) return;
  
  const currentIndex = window.shbfIndex.findIndex(v => v.name === currentVersionName);
  // Om vi hittar en äldre version (listan är sorterad fallande, så nästa index är äldre)
  if (currentIndex >= 0 && currentIndex + 1 < window.shbfIndex.length) {
    const prevVersionName = window.shbfIndex[currentIndex + 1].name;
    try {
      const prevData = await hamtaData('SHBF', prevVersionName);
      window.foregaendeKategorier = parseBeerStyles(prevData);
      window.foregaendeVersionNamn = prevVersionName;
    } catch(e) {
      console.warn("Kunde inte ladda föregående version för diff", e);
    }
  }
}
