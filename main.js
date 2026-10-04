/* ─────────────────────────────────────────────────────────────────
   main.js — Alan Teixidó CV
   Effects:
     01. Navbar scroll + active section highlight
     02. Mobile hamburger menu
     03. Scroll reveal (IntersectionObserver)
     04. Language bar fill animation
     06. Scroll progress bar
     13. Projects 3D carousel
     17. Skill pills stagger entrance
     18. Hero 3D torus knot (desktop; still frame with reduced motion)
     25. Timeline accordion
     26. Back to top
     21. Copy-to-clipboard toast
───────────────────────────────────────────────────────────────── */

const isTouch       = !window.matchMedia('(pointer: fine)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 01. Navbar scroll + active section ──────────────────────── */
const navbar      = document.getElementById('navbar');
const navAnchors  = document.querySelectorAll('.nav-links a[href^="#"]');
const sections    = document.querySelectorAll('section[id]');

function updateNav() {
  navbar.classList.toggle('scrolled', window.scrollY > 20);

  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navAnchors.forEach(a => {
    a.classList.toggle('nav-active', a.getAttribute('href') === `#${current}`);
  });
}
window.addEventListener('scroll', updateNav, { passive: true });

/* ── 02. Mobile hamburger menu ────────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

function closeMobile() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Open menu');
}

/* ── 03. Scroll reveal ────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── 04. Language bar fill ────────────────────────────────────── */
const langObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('.lang-bar-fill').forEach(fill => {
      fill.style.transform = `scaleX(${fill.dataset.width || '1'})`;
    });
  });
}, { threshold: 0.3 });

document.querySelectorAll('.about-card').forEach(el => langObserver.observe(el));

/* ── 06. Scroll progress bar ─────────────────────────────────── */
const progressBar = document.createElement('div');
progressBar.id = 'scroll-progress';
document.body.prepend(progressBar);

window.addEventListener('scroll', () => {
  const max  = document.documentElement.scrollHeight - window.innerHeight;
  const pct  = max > 0 ? (window.scrollY / max) * 100 : 0;
  progressBar.style.width = `${pct}%`;
}, { passive: true });

/* ── 13. Projects 3D carousel — enhanced ──────────────────────── */
(function initProjCarousel() {
  const wrap    = document.querySelector('.proj-car-wrap');
  const slides  = Array.from(document.querySelectorAll('.proj-slide'));
  const dots    = Array.from(document.querySelectorAll('.proj-dot'));
  const prevBtn = document.getElementById('projPrev');
  const nextBtn = document.getElementById('projNext');
  const counter = document.getElementById('projCounter');
  const progBar = document.getElementById('projProgress');
  if (!wrap || !slides.length) return;

  const N = slides.length;
  let active = 0;
  const AUTO_MS = 5000;

  /* 5-slot depth positions with blur depth-of-field */
  const POS = {
    '-2': { tx: -600, ry:  35, sc: 0.58, op: 0.18, blur: 5 },
    '-1': { tx: -330, ry:  18, sc: 0.82, op: 0.55, blur: 2 },
     '0': { tx:    0, ry:   0, sc: 1.00, op: 1.00, blur: 0 },
     '1': { tx:  330, ry: -18, sc: 0.82, op: 0.55, blur: 2 },
     '2': { tx:  600, ry: -35, sc: 0.58, op: 0.18, blur: 5 },
  };

  function resetProgress() {
    if (!progBar) return;
    progBar.classList.remove('filling');
    void progBar.offsetWidth;
    progBar.classList.add('filling');
  }

  function setPositions() {
    slides.forEach((slide, i) => {
      let diff = i - active;
      if (diff < -(N / 2)) diff += N;
      if (diff >  (N / 2)) diff -= N;

      const slot = Math.max(-2, Math.min(2, diff));
      const p    = POS[slot];
      const zi   = diff === 0 ? 10 : 8 - Math.abs(diff);

      slide.style.transform     = `translateX(${p.tx}px) rotateY(${p.ry}deg) scale(${p.sc})`;
      slide.style.opacity       = Math.abs(diff) <= 2 ? p.op : 0;
      slide.style.filter        = `blur(${p.blur}px)`;
      slide.style.zIndex        = zi;
      slide.style.pointerEvents = diff === 0 ? 'auto' : 'none';
      slide.classList.toggle('proj-active', diff === 0);
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === active));
    if (counter) counter.textContent = `${active + 1} / ${N}`;
    resetProgress();
  }

  function goTo(idx) {
    active = ((idx % N) + N) % N;
    setPositions();
  }

  /* ── Auto-play (disabled for users preferring reduced motion) ── */
  let autoTimer = prefersReduced ? null : setInterval(() => goTo(active + 1), AUTO_MS);
  function restartAuto() {
    clearInterval(autoTimer);
    if (!prefersReduced) autoTimer = setInterval(() => goTo(active + 1), AUTO_MS);
  }

  wrap.addEventListener('mouseenter', () => {
    clearInterval(autoTimer);
    if (progBar) progBar.style.animationPlayState = 'paused';
  });
  wrap.addEventListener('mouseleave', () => {
    restartAuto();
    if (progBar) progBar.style.animationPlayState = 'running';
  });

  /* ── Controls ──────────────────────────────────────────────── */
  prevBtn.addEventListener('click', () => { restartAuto(); goTo(active - 1); });
  nextBtn.addEventListener('click', () => { restartAuto(); goTo(active + 1); });
  dots.forEach((d, i) => d.addEventListener('click', () => { restartAuto(); goTo(i); }));

  slides.forEach((slide, i) => {
    slide.addEventListener('click', e => {
      if (i !== active) { e.preventDefault(); restartAuto(); goTo(i); }
    });
  });

  /* Drag / swipe */
  let startX = 0, pointerDown = false;
  wrap.addEventListener('mousedown',  e => { startX = e.clientX; pointerDown = true; });
  wrap.addEventListener('mouseup',    e => {
    if (!pointerDown) return;
    pointerDown = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 55) { restartAuto(); goTo(active + (dx < 0 ? 1 : -1)); }
  });
  wrap.addEventListener('mouseleave', () => { pointerDown = false; });
  wrap.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { restartAuto(); goTo(active + (dx < 0 ? 1 : -1)); }
  }, { passive: true });

  /* Arrow keys */
  document.addEventListener('keydown', e => {
    const sec = document.getElementById('projects');
    if (!sec) return;
    const r = sec.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      if (e.key === 'ArrowLeft')  { restartAuto(); goTo(active - 1); }
      if (e.key === 'ArrowRight') { restartAuto(); goTo(active + 1); }
    }
  });

  /* ── Parallax on active card hover ─────────────────────────── */
  if (!isTouch) {
    slides.forEach(slide => {
      slide.addEventListener('mousemove', e => {
        if (!slide.classList.contains('proj-active')) return;
        const rect = slide.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        const thumb = slide.querySelector('.pp-thumb img');
        if (thumb) thumb.style.transform = `scale(1.06) translate(${cx * -12}px, ${cy * -8}px)`;
      }, { passive: true });
      slide.addEventListener('mouseleave', () => {
        const thumb = slide.querySelector('.pp-thumb img');
        if (thumb) thumb.style.transform = '';
      });
    });
  }

  setPositions();
})();

/* ── 17. Skill pills stagger entrance ────────────────────────── */
(function initPillStagger() {
  const groupObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const pills = entry.target.querySelectorAll('.skill-pill');
      pills.forEach((pill, i) => {
        pill.style.transitionDelay = `${i * 50}ms`;
        pill.classList.add('pill-visible');
      });
      groupObserver.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.skill-group').forEach(g => groupObserver.observe(g));
})();

/* ── 18. Hero 3D — wireframe torus knot (Canvas 2D, zero deps) ── */
(function initHero3D() {
  if (isTouch) return;
  const wrap = document.getElementById('hero-3d');
  if (!wrap) return;

  /* Create canvas and fill the overlay div */
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block;';
  wrap.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  /* Cap internal resolution — upscale via CSS on large monitors */
  const MAX_W = 1100;
  let W, H;
  function resize() {
    const w = wrap.offsetWidth, h = wrap.offsetHeight;
    const k = Math.min(1, MAX_W / (w || 1));
    W = canvas.width  = Math.max(1, Math.round(w * k));
    H = canvas.height = Math.max(1, Math.round(h * k));
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ── Build torus-knot tube geometry (CPU, once) ────────────── */
  function buildTube(p, q, NC, NT, sc, tr) {
    // Sample curve
    const cv = [];
    for (let i = 0; i <= NC; i++) {
      const t = (i / NC) * Math.PI * 2;
      const r = (Math.cos(q * t) + 2) * sc;
      cv.push([r * Math.cos(p * t), r * Math.sin(p * t), -Math.sin(q * t) * sc]);
    }
    // Build rings using Frenet frame (T × world-up approximation)
    const rings = [];
    for (let i = 0; i <= NC; i++) {
      const nxt = cv[(i + 1) % (NC + 1)];
      const prv = cv[i > 0 ? i - 1 : NC];
      let tx = nxt[0]-prv[0], ty = nxt[1]-prv[1], tz = nxt[2]-prv[2];
      const tl = Math.sqrt(tx*tx+ty*ty+tz*tz) || 1;
      tx /= tl; ty /= tl; tz /= tl;
      // Binormal  B = T × (0,1,0) = [-tz, 0, tx]
      let bx = -tz, bz = tx;
      const bl = Math.sqrt(bx*bx + bz*bz);
      if (bl < 0.001) { bx = 1; bz = 0; } else { bx /= bl; bz /= bl; }
      // Normal  N = B × T
      const nx = -bz*ty, ny = bz*tx - bx*tz, nz = bx*ty;
      const ring = [];
      for (let j = 0; j < NT; j++) {
        const a = (j / NT) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        ring.push([
          cv[i][0] + tr*(ca*nx + sa*bx),
          cv[i][1] + tr*(ca*ny),           // by = 0
          cv[i][2] + tr*(ca*nz + sa*bz),
        ]);
      }
      rings.push(ring);
    }
    return { rings, NC, NT };
  }

  const k1 = buildTube(2, 3, 160, 12, 88, 23); // main knot  (p2,q3)
  const k2 = buildTube(3, 5, 100,  8, 58, 15); // accent knot (p3,q5)

  /* ── Fast perspective projection (trig precomputed per frame) ── */
  function makeProj(rx, ry) {
    const cy = Math.cos(ry), sy = Math.sin(ry);
    const cx = Math.cos(rx), sx = Math.sin(rx);
    const fov = Math.min(W, H) * 0.88;
    return (x, y, z) => {
      const x1 = x*cy - z*sy, z1 = x*sy + z*cy;
      const y2 = y*cx - z1*sx, z2 = y*sx + z1*cx;
      const s = fov / (fov + z2);
      return [W/2 + x1*s, H/2 + y2*s, z2, s];
    };
  }

  /* ── Draw one knot (pre-project all verts once) ─────────────── */
  function drawKnot({ rings, NC, NT }, pfn, color, alpha, rStep, cStep) {
    // Pre-project every vertex
    const P = rings.map(ring => ring.map(([x, y, z]) => pfn(x, y, z)));

    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth   = 0.8;

    // Longitudinal lines (along the path)
    for (let j = 0; j < NT; j += rStep) {
      ctx.beginPath();
      for (let i = 0; i <= NC; i++) {
        const [px, py] = P[i][j];
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // Cross-section rings
    for (let i = 0; i <= NC; i += cStep) {
      ctx.beginPath();
      for (let j = 0; j <= NT; j++) {
        const [px, py] = P[i][j % NT];
        j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  /* ── Fibonacci-sphere particles ─────────────────────────────── */
  const PARTS = Array.from({ length: 180 }, (_, i) => {
    const phi = Math.acos(1 - 2*(i+0.5)/180), theta = Math.PI*(1+Math.sqrt(5))*i;
    const r = 115 + (i % 5)*9;
    return [r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi)];
  });

  /* ── Mouse tracking ──────────────────────────────────────────── */
  let mx = 0, my = 0, cmx = 0, cmy = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX/window.innerWidth  - 0.5) * 2;
    my = (e.clientY/window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const heroEl = document.getElementById('hero');
  let t = 0;

  /* ── Draw one frame at the current angle ────────────────────── */
  function draw(fade) {
    const ry = t * 0.20 + cmx * 0.5;
    const rx = t * 0.13 + cmy * 0.5;

    ctx.clearRect(0, 0, W, H);

    // Main knot — indigo/lavender
    drawKnot(k1, makeProj(rx, ry),                   '#9d85ff', 0.88 * fade, 2, 8);
    // Accent knot — cyan, counter-rotated
    drawKnot(k2, makeProj(-rx*0.8+0.4, ry*0.9+1.1), '#ffb347', 0.52 * fade, 2, 6);

    // Particles
    const pfn = makeProj(rx*0.22, ry*0.22);
    ctx.fillStyle   = '#d9ceff';
    ctx.globalAlpha = 0.48 * fade;
    PARTS.forEach(([ox, oy, oz]) => {
      const [px, py, , ps] = pfn(ox, oy, oz);
      if (ps > 0) { const sz = Math.max(0.5, ps*1.6); ctx.fillRect(px-sz/2, py-sz/2, sz, sz); }
    });

    ctx.globalAlpha = 1;
  }

  /* Reduced motion: a single still frame. Resizing clears the canvas
     (resize() runs first, it was registered earlier), so draw it again. */
  if (prefersReduced) {
    t = 3;
    draw(1);
    window.addEventListener('resize', () => draw(1), { passive: true });
    return;
  }

  /* ── Render loop ────────────────────────────────────────────── */
  (function frame() {
    requestAnimationFrame(frame);
    t += 0.007;
    cmx += (mx - cmx) * 0.04;
    cmy += (my - cmy) * 0.04;

    const fade = heroEl ? Math.max(0, 1 - window.scrollY/heroEl.offsetHeight*1.8) : 1;
    if (fade <= 0.01) return;
    draw(fade);
  })();
})();

/* ── 25. Timeline accordion (collapsible bullets) ────────────── */
(function initTimelineAccordion() {
  /* A pixel max-height is only used while animating; once open it becomes
     'none' so text can reflow (font load, resize, rotation) without clipping */
  function open(card, bullets) {
    bullets.style.maxHeight = bullets.scrollHeight + 'px';
    bullets.addEventListener('transitionend', function done(e) {
      if (e.target !== bullets || e.propertyName !== 'max-height') return;
      bullets.removeEventListener('transitionend', done);
      if (card.classList.contains('expanded')) bullets.style.maxHeight = 'none';
    });
  }
  function close(bullets) {
    bullets.style.maxHeight = bullets.scrollHeight + 'px'; /* 'none' can't animate */
    void bullets.offsetHeight;
    bullets.style.maxHeight = '0';
  }

  document.querySelectorAll('.timeline-card').forEach((card, i) => {
    const bullets = card.querySelector('.timeline-bullets');
    if (!bullets) return;

    /* Non-tech cards: always expanded, no toggle (they're short) */
    if (card.classList.contains('non-tech')) {
      card.classList.add('expanded');
      bullets.style.maxHeight = 'none';
      return;
    }

    /* Create toggle button */
    const toggle = document.createElement('button');
    toggle.className = 'timeline-toggle';
    const isFirst = i === 0;
    toggle.innerHTML = `<span>${isFirst ? 'Hide details' : 'Show details'}</span> <i class="fa-solid fa-chevron-down"></i>`;
    bullets.before(toggle);

    /* First tech card starts expanded */
    if (isFirst) {
      card.classList.add('expanded');
      bullets.style.maxHeight = 'none';
    }

    toggle.addEventListener('click', () => {
      const expanding = card.classList.toggle('expanded');
      toggle.querySelector('span').textContent = expanding ? 'Hide details' : 'Show details';
      if (expanding) open(card, bullets);
      else close(bullets);
    });
  });
})();

/* ── 26. Back to top button ─────────────────────────────────────── */
(function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > window.innerHeight * 0.8);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
})();

/* ── 21. Copy-to-clipboard with toast ───────────────────────────── */
(function initClipboard() {
  const toast    = document.getElementById('clipboard-toast');
  const toastTxt = document.getElementById('toast-text');
  if (!toast) return;

  let hideTimer;
  function showToast(msg) {
    toastTxt.textContent = msg;
    toast.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  document.querySelectorAll('[data-copy]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const text = el.dataset.copy;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showToast(text));
      } else {
        const ta = Object.assign(document.createElement('textarea'), { value: text });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast(text);
      }
    });
  });
})();
