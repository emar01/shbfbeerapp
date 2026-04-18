const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => console.log('PAGE RESPONSE:', response.url(), response.status()));
  
  await page.goto('http://localhost:8000', {waitUntil: 'networkidle2'});
  
  const h1 = await page.$eval('h1', el => el.innerText).catch(() => 'no h1');
  console.log('H1:', h1);
  const valjare = await page.$eval('#versionSelect', el => el.innerHTML).catch(() => 'no valjare');
  console.log('valjare.innerHTML:', valjare);
  
  await browser.close();
})();
