const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const distDir = path.resolve(__dirname, '..', 'dist');
const errors = [];

function checkFile(relativePath) {
  const filePath = path.join(distDir, relativePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    errors.push(`Missing required build file: ${relativePath}`);
  }
}

function checkLocalReference(reference, fromFile, description) {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(reference)) return;

  const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  const targetPath = path.resolve(
    cleanReference.startsWith('/') ? distDir : path.dirname(fromFile),
    cleanReference.replace(/^[/\\]+/, ''),
  );
  const relativeTarget = path.relative(distDir, targetPath);
  if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
    errors.push(`Reference escapes dist/: ${description} -> ${reference}`);
  } else if (!fs.existsSync(targetPath)) {
    errors.push(`Missing local resource: ${description} -> ${reference}`);
  }
}

function readText(relativePath) {
  const filePath = path.join(distDir, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

for (const requiredPath of [
  'index.html',
  'style.css',
  'manifest.json',
  'sw.js',
  'js/app.js',
  'db/bjcp-beer-2021_en.xml',
  'assets/logo.png',
  'assets/icons/icon-192x192.png',
]) {
  checkFile(requiredPath);
}

const html = readText('index.html');
for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
  checkLocalReference(match[1], path.join(distDir, 'index.html'), 'index.html');
}

const css = readText('style.css');
for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
  checkLocalReference(match[1].trim(), path.join(distDir, 'style.css'), 'style.css');
}

try {
  const manifest = JSON.parse(readText('manifest.json'));
  for (const icon of manifest.icons || []) {
    checkLocalReference(icon.src, path.join(distDir, 'manifest.json'), 'manifest.json');
  }
} catch (error) {
  errors.push(`Invalid manifest.json: ${error.message}`);
}

const jsDir = path.join(distDir, 'js');
if (fs.existsSync(jsDir)) {
  for (const entry of fs.readdirSync(jsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const filePath = path.join(jsDir, entry.name);
    const source = fs.readFileSync(filePath, 'utf8');
    for (const match of source.matchAll(/\b(?:from\s*|import\s*)["']([^"']+)["']/g)) {
      if (match[1].startsWith('.')) {
        checkLocalReference(match[1], filePath, entry.name);
      }
    }
    try {
      execFileSync(process.execPath, ['--check', filePath], { stdio: 'pipe' });
    } catch (error) {
      errors.push(`JavaScript syntax error in js/${entry.name}: ${error.stderr?.toString().trim() || error.message}`);
    }
  }
}

const serviceWorker = readText('sw.js');
const cacheList = serviceWorker.match(/const\s+assetsToCache\s*=\s*\[([\s\S]*?)\];/);
if (!cacheList) {
  errors.push('Could not find assetsToCache in sw.js');
} else {
  for (const match of cacheList[1].matchAll(/["']([^"']+)["']/g)) {
    checkLocalReference(match[1], path.join(distDir, 'sw.js'), 'sw.js cache list');
  }
  try {
    execFileSync(process.execPath, ['--check', path.join(distDir, 'sw.js')], { stdio: 'pipe' });
  } catch (error) {
    errors.push(`JavaScript syntax error in sw.js: ${error.stderr?.toString().trim() || error.message}`);
  }
}

if (errors.length) {
  console.error('Build verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Build verification passed: required files, local references, and JavaScript syntax are valid.');
