#!/usr/bin/env node
/* Builds cv/Alan_Teixido_CV.pdf from cv/cv.html with headless Chrome.
   The web fonts and the photo are inlined as data URIs first, so the print
   doesn't depend on file:// loading. Usage: node scripts/build-cv.js [output.pdf] */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'cv', 'cv.html');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'cv', 'Alan_Teixido_CV.pdf'));

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find(p => p && fs.existsSync(p));
if (!CHROME) {
  console.error('build-cv: Chrome not found (set CHROME_PATH)');
  process.exit(1);
}

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const html = fs.readFileSync(SRC, 'utf8')
  .replace(/url\('\.\.\/fonts\/([^']+\.woff2)'\)/g, (_, file) => {
    const data = fs.readFileSync(path.join(ROOT, 'fonts', file)).toString('base64');
    return `url('data:font/woff2;base64,${data}')`;
  })
  .replace(/src="\.\.\/images\/([^"]+\.(?:jpe?g|png|webp))"/g, (_, file) => {
    const data = fs.readFileSync(path.join(ROOT, 'images', file)).toString('base64');
    return `src="data:${MIME[path.extname(file).toLowerCase()]};base64,${data}"`;
  });

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-'));
const tmpHtml = path.join(tmpDir, 'cv.html');
fs.writeFileSync(tmpHtml, html);

try {
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
    `--user-data-dir=${path.join(tmpDir, 'profile')}`,
    '--virtual-time-budget=3000',
    `--print-to-pdf=${OUT}`,
    'file:///' + tmpHtml.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

const pdf = fs.readFileSync(OUT, 'latin1');
const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`build-cv: ${path.relative(ROOT, OUT)} (${pages} page${pages === 1 ? '' : 's'}, ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
if (pages !== 1) {
  console.error('build-cv: the CV must fit on one page');
  process.exit(1);
}
