// app.js
// Huvudapplikation - ansvarar för initialisering och koordinering av moduler

import { hamtaData } from './api.js';
import { parseBeerStyles } from './parser.js';
import { renderAccordion, visaTypDetalj } from './renderer.js';
import { filtreraKategorier } from './search.js';
import { startaQuiz, svaraQuiz, gaForegaendeFraga, gaNastaFraga, visaQuizResultat } from './quiz.js';
import { generateBeerName } from './nameGenerator.js';
import { initTheme } from './theme.js';

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
  let data = await hamtaData(aktuellKalla);
  window.kategorier = parseBeerStyles(data);
  renderAccordion(window.kategorier);

  // Registrera event listeners
  registerEventListeners(aktuellKalla);
  
  // Initiera tema
  initTheme();
}

/**
 * Registrera alla event listeners
 */
function registerEventListeners(aktuellKalla) {
  // Byt källa vid val
  document.getElementById('kallaSelect').addEventListener('change', async (e) => {
    aktuellKalla = e.target.value;
    const data = await hamtaData(aktuellKalla);
    window.kategorier = parseBeerStyles(data);
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
