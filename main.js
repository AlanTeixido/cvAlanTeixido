/* ─────────────────────────────────────────────────────────────────
   main.js — behaviour shared by index.html and projects.html

     1. Hero intro: the terminal's status lines type themselves out
     2. Navbar: border once the page scrolls, current section
     3. Mobile menu
     4. Copy-to-clipboard toast (the email in the footer)
     5. Video dialogs (the CV in 30 seconds, the Nox demo)
     6. Text that fills in as it scrolls past ([data-fill])

   Every block looks for its own elements and returns if they aren't on
   the page, so both pages load the same file.
───────────────────────────────────────────────────────────────── */

/* ── 1. Hero intro ────────────────────────────────────────────────
   The sequence itself is CSS, switched on by html.intro (set in <head> on
   the first visit of the session). This only splits the terminal's lines
   into per-character spans with staggered delays. It runs first so its
   clock matches the CSS animations, and the CSS has a fallback that shows
   the text anyway if this runs late or not at all. */
(function initHeroIntro() {
  if (!document.documentElement.classList.contains('intro')) return;
  const block = document.querySelector('.term-body');
  /* Already revealed by the CSS fallback: leave it as plain text */
  if (!block || getComputedStyle(block).opacity !== '0') return;

  const START = 700, STEP = 17, LINE_PAUSE = 160;   /* ms */

  /* One span per character, keeping inner markup (prompt, arrows).
     Screen readers get the plain text from a visually hidden copy. */
  function splitChars(el) {
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = el.textContent.replace(/\s+/g, ' ').trim();
    visual.append(...el.childNodes);
    el.append(visual, sr);

    const textNodes = [];
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    const chars = [];
    for (const node of textNodes) {
      const frag = document.createDocumentFragment();
      for (const ch of node.textContent) {
        const span = document.createElement('span');
        span.className = 'tch';
        span.textContent = ch;
        frag.append(span);
        chars.push(span);
      }
      node.replaceWith(frag);
    }
    return chars;
  }

  /* --d: when the character appears · --s: how long the caret stays on it */
  let t = START, last = null;
  for (const lineEl of block.querySelectorAll('.term-line')) {
    const chars = splitChars(lineEl);
    chars.forEach((c, i) => {
      const isLineEnd = i === chars.length - 1;
      c.style.setProperty('--d', `${t}ms`);
      c.style.setProperty('--s', `${isLineEnd ? STEP + LINE_PAUSE : STEP}ms`);
      t += STEP;
      last = c;
    });
    t += LINE_PAUSE;
  }
  if (last) last.classList.add('is-last');
  block.classList.add('is-typing');
})();

/* ── 2. Navbar ────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mark the link of the section that crosses the upper third of the screen */
  const links = new Map();
  for (const a of navbar.querySelectorAll('.nav-links a[href^="#"]')) {
    const section = document.getElementById(a.hash.slice(1));
    if (section) links.set(section, a);
  }
  if (!links.size) return;

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach(a => a.removeAttribute('aria-current'));
      links.get(entry.target).setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-30% 0px -65% 0px' });
  links.forEach((_, section) => observer.observe(section));
})();

/* ── 3. Mobile menu ───────────────────────────────────────────── */
(function initMobileMenu() {
  const button = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!button || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
})();

/* ── 4. Copy-to-clipboard toast ───────────────────────────────── */
(function initClipboard() {
  const toast = document.getElementById('clipboard-toast');
  if (!toast || !navigator.clipboard) return;   // without the API the mailto: link just works

  let hideTimer;
  for (const el of document.querySelectorAll('[data-copy]')) {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigator.clipboard.writeText(el.dataset.copy).then(() => {
        toast.textContent = `Copied ${el.dataset.copy}`;
        toast.classList.add('show');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => toast.classList.remove('show'), 2600);
      }, () => { location.href = el.href; });
    });
  }
})();

/* ── 5. Video dialogs ─────────────────────────────────────────────
   A button with data-video-dialog="<id>" opens that <dialog> and plays the
   video inside it. Without <dialog> support the button is hidden. */
(function initVideoDialogs() {
  for (const button of document.querySelectorAll('[data-video-dialog]')) {
    const dialog = document.getElementById(button.dataset.videoDialog);
    if (!dialog || typeof dialog.showModal !== 'function') { button.hidden = true; continue; }
    button.addEventListener('click', () => {
      dialog.showModal();
      dialog.querySelector('video').play().catch(() => {});
    });
  }
  for (const dialog of document.querySelectorAll('dialog.cv-video')) {
    dialog.querySelector('.cv-video-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });   // click on the backdrop
    dialog.addEventListener('close', () => dialog.querySelector('video').pause());
  }
})();

/* ── 6. Text that fills in as it scrolls past ─────────────────────
   Each word of a [data-fill] paragraph goes from faint to full as the
   paragraph crosses the middle of the screen. The words stay ordinary text
   for screen readers; with reduced motion nothing is split and the
   paragraph is simply shown. */
(function initFillText() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const blocks = [...document.querySelectorAll('[data-fill]')].map(el => {
    const words = el.textContent.trim().split(/\s+/).map(word => {
      const span = document.createElement('span');
      span.className = 'fill-word';
      span.textContent = word;
      return span;
    });
    el.replaceChildren(...words.flatMap(span => [span, ' ']));
    return { el, words };
  });
  if (!blocks.length) return;

  let queued = false;
  function update() {
    queued = false;
    const vh = window.innerHeight;
    for (const { el, words } of blocks) {
      const box = el.getBoundingClientRect();
      /* 0 when its top reaches 85% of the screen, 1 when it reaches 40% */
      const progress = Math.min(Math.max((vh * 0.85 - box.top) / (vh * 0.45), 0), 1);
      const lit = Math.round(progress * words.length);
      words.forEach((word, i) => word.classList.toggle('is-lit', i < lit));
    }
  }
  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();
