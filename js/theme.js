// theme.js
// Ansvarar för temaväxling mellan ljust och mörkt läge

/**
 * Initiera tema-växlare
 */
export function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const htmlEl = document.documentElement;

  // Starta alltid i ljust läge
  const savedTheme = 'light';
  htmlEl.setAttribute('data-bs-theme', savedTheme);
  updateThemeIcon(themeToggleBtn, savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(themeToggleBtn, newTheme);
  });
}

/**
 * Uppdatera tema-ikon
 * @private
 */
function updateThemeIcon(btn, theme) {
  btn.querySelector('i').className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
}
