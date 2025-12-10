// Script för att ladda ner SHBF-data och spara lokalt
// Kör: node update-shbf-data.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://styles.shbf.se/json/2020/styles';
const OUTPUT_FILE = path.join(__dirname, 'db', 'shbf-styles.json');

console.log('Laddar ner SHBF-data från:', API_URL);

https.get(API_URL, (response) => {
  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    try {
      // Validera att det är giltig JSON
      const json = JSON.parse(data);
      
      // Skapa db-mappen om den inte finns
      const dbDir = path.dirname(OUTPUT_FILE);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Spara filen
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(json, null, 2), 'utf8');
      console.log('✓ SHBF-data sparad i:', OUTPUT_FILE);
      console.log('✓ Antal kategorier:', json.length);
    } catch (error) {
      console.error('✗ Fel vid parsning/sparning:', error.message);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error('✗ Fel vid nedladdning:', error.message);
  process.exit(1);
});
