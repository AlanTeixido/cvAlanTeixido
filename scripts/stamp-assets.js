#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────
   stamp-assets.js — cache busting for the static site

   Rewrites every reference to a local CSS, JS, image or font in the HTML
   pages as  path?v=<hash>,  where <hash> is the first 8 characters of the
   file's git blob hash (its content hash). A version therefore changes
   only when that file's content changes, which is what makes
   "Cache-Control: immutable" safe on the server.

   url(...) references inside the stylesheets (fonts, images) are stamped
   the same way, first, so a stylesheet's own hash already covers them.
   The fonts the pages preload therefore have the same URL in the
   <link rel="preload"> and in the @font-face, and are fetched once.

   PDFs and HTML pages are left alone: nginx serves them with no-cache.

   Usage:   node scripts/stamp-assets.js           rewrite the pages
            node scripts/stamp-assets.js --check   exit 1 if any stamp is stale
   Runs automatically from .githooks/pre-commit.
───────────────────────────────────────────────────────────────── */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PAGES = ['index.html', 'projects.html', '404.html'];
const STYLESHEETS = ['style.css'];
const CHECK = process.argv.includes('--check');

/* A quoted local reference: "style.css", "/favicon.svg", "images/x.webp",
   "https://alanteixido.dev/images/og-image.jpg" — with or without ?v=…
   (group 1 keeps the prefix as written; group 2 is the repo-relative path) */
const REF = /"((?:https:\/\/alanteixido\.dev)?\/?)([\w\-./]+\.(?:css|js|png|jpe?g|webp|svg|gif|ico|woff2?))(?:\?v=[0-9a-f]*)?"/gi;

/* A local url(...) in a stylesheet, quoted or not; data: URIs never match.
   Paths are relative to the stylesheet, which lives at the repo root. */
const CSS_REF = /url\((["']?)(\/?)([\w\-./]+\.(?:png|jpe?g|webp|svg|gif|woff2?))(?:\?v=[0-9a-f]*)?\1\)/gi;

const cache = new Map();
function version(rel) {
  if (!cache.has(rel)) {
    /* git hash-object applies the repo's line-ending normalisation, so the
       hash is the same on Windows (CRLF checkout) and on the Linux server */
    const hash = execFileSync('git', ['hash-object', rel], { cwd: ROOT, encoding: 'utf8' }).trim();
    cache.set(rel, hash.slice(0, 8));
  }
  return cache.get(rel);
}

let stale = 0;
function stamp(name, pattern, rewrite) {
  const file = path.join(ROOT, name);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(pattern, (match, ...groups) => {
    const rel = rewrite.rel(groups);
    if (!fs.existsSync(path.join(ROOT, rel))) {
      console.warn(`  ! ${name}: ${rel} not found, left unversioned`);
      return match;
    }
    return rewrite.out(groups, version(rel));
  });
  if (after !== before) {
    stale++;
    if (CHECK) console.log(`stale stamps: ${name}`);
    else { fs.writeFileSync(file, after); console.log(`stamped: ${name}`); }
  }
}

/* Stylesheets first: their hashes must include their own stamps */
for (const css of STYLESHEETS) {
  stamp(css, CSS_REF, {
    rel: ([, , rel]) => rel,
    out: ([quote, slash, rel], v) => `url(${quote}${slash}${rel}?v=${v}${quote})`,
  });
}
for (const page of PAGES) {
  stamp(page, REF, {
    rel: ([, rel]) => rel,
    out: ([prefix, rel], v) => `"${prefix}${rel}?v=${v}"`,
  });
}

if (CHECK && stale) process.exit(1);
if (!stale) console.log('asset stamps up to date');
