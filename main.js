/* ─────────────────────────────────────────────────────────────────
   main.js — Alan Teixidó CV
   Effects:
     01. Navbar scroll + active section highlight
     02. Mobile hamburger menu
     03. Scroll reveal (IntersectionObserver)
     04. Language bar fill animation
     05. Hero canvas — particle network
     06. Scroll progress bar
     07. Custom cursor (desktop only)
     08. 3D card tilt on hover
     09. Count-up animation for hero stats
     10. Parallax on hero glow orbs
     11. Magnetic buttons
     12. Skill pills stagger entrance
───────────────────────────────────────────────────────────────── */

/* ── 00. Page loader ─────────────────────────────────────────── */
(function initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  /* hide after content paints + short delay */
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 900);
  });
  /* fallback: always hide after 3s */
  setTimeout(() => loader.classList.add('hidden'), 3000);
})();

const isTouch = !window.matchMedia('(pointer: fine)').matches;

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
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

function closeMobile() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
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

/* ── 05. Hero canvas — particle network ───────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const HERO   = document.getElementById('hero');
  const COUNT  = 80;
  const DIST   = 120;

  let w, h, particles;
  let mouse = { x: -9999, y: -9999 };

  function resize() {
    w = canvas.width  = HERO.offsetWidth;
    h = canvas.height = HERO.offsetHeight;
  }

  function createParticles() {
    particles = Array.from({ length: COUNT }, () => ({
      x:  Math.random() * w,
      y:  Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r:  Math.random() * 1.5 + 0.5,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99,102,241,0.35)';
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99,102,241,${(1 - dist / DIST) * 0.12})`;
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      const dx   = p.x - mouse.x;
      const dy   = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(34,211,238,${(1 - dist / 160) * 0.25})`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); createParticles(); }, { passive: true });

  HERO.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });

  HERO.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  resize(); createParticles(); draw();
})();

/* ── 06. Scroll progress bar ─────────────────────────────────── */
const progressBar = document.createElement('div');
progressBar.id = 'scroll-progress';
document.body.prepend(progressBar);

window.addEventListener('scroll', () => {
  const max  = document.documentElement.scrollHeight - window.innerHeight;
  const pct  = max > 0 ? (window.scrollY / max) * 100 : 0;
  progressBar.style.width = `${pct}%`;
}, { passive: true });

/* ── 07. Custom cursor (desktop only) ────────────────────────── */
if (!isTouch) {
  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.id  = 'cursor-dot';
  ring.id = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  });

  /* lerp ring toward dot */
  (function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(animRing);
  })();

  /* cursor states */
  const hoverEls = document.querySelectorAll('a, button, .timeline-card, .skill-group, .edu-card, .about-photo-wrap, .btn');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => { ring.classList.add('hovered'); dot.classList.add('hovered'); });
    el.addEventListener('mouseleave', () => { ring.classList.remove('hovered'); dot.classList.remove('hovered'); });
  });

  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
}

/* ── 08. 3D card tilt ────────────────────────────────────────── */
if (!isTouch) {
  const tiltCards = document.querySelectorAll('.timeline-card, .skill-group, .edu-card, .about-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const rotX   = (-dy * 5).toFixed(2);
      const rotY   = ( dx * 5).toFixed(2);
      card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ── 09. Count-up for hero stats ─────────────────────────────── */
(function initCountUp() {
  const targets = [
    { el: document.querySelector('.hero-stat-num:nth-child(1)'), end: 2,  suffix: '+' },
  ];

  /* grab all stat nums dynamically */
  const statNums = document.querySelectorAll('.hero-stat-num');
  const data     = [{ end: 2, suffix: '+' }, { end: 5, suffix: '+' }, { end: 3, suffix: '+' }];

  function countUp(el, end, suffix, duration = 1200) {
    const start     = performance.now();
    const startVal  = 0;
    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
      const val      = Math.floor(startVal + (end - startVal) * ease);
      el.innerHTML   = `${val}<span>${suffix}</span>`;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* trigger when hero stats become visible */
  const statsEl = document.querySelector('.hero-stats');
  if (statsEl) {
    const once = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      statNums.forEach((el, i) => countUp(el, data[i].end, data[i].suffix));
      once.disconnect();
    }, { threshold: 0.5 });
    once.observe(statsEl);
  }
})();

/* ── 10. Parallax on hero glow orbs ─────────────────────────── */
(function initParallax() {
  const glow1 = document.querySelector('.hero-glow-1');
  const glow2 = document.querySelector('.hero-glow-2');
  if (!glow1 || !glow2) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    glow1.style.transform = `translate(0, ${y * 0.15}px) scale(1)`;
    glow2.style.transform = `translate(0, ${-y * 0.1}px) scale(1)`;
  }, { passive: true });
})();

/* ── 11. Magnetic buttons ────────────────────────────────────── */
if (!isTouch) {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const dx   = e.clientX - (rect.left + rect.width  / 2);
      const dy   = e.clientY - (rect.top  + rect.height / 2);
      btn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.22}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ── 13. Projects 3D carousel (from carousel resource) ──────────── */
(function initProjCarousel() {
  const wrap    = document.querySelector('.proj-car-wrap');
  const slides  = Array.from(document.querySelectorAll('.proj-slide'));
  const dots    = Array.from(document.querySelectorAll('.proj-dot'));
  const prevBtn = document.getElementById('projPrev');
  const nextBtn = document.getElementById('projNext');
  if (!wrap || !slides.length) return;

  const N = slides.length;
  let active = 0;

  /* 3D positions per slot: -1 = left, 0 = center, +1 = right */
  const POS = {
    '-1': { tx: -375, ry:  20, sc: 0.78, op: 0.50 },
     '0': { tx:    0, ry:   0, sc: 1.00, op: 1.00 },
     '1': { tx:  375, ry: -20, sc: 0.78, op: 0.50 },
  };

  function setPositions() {
    slides.forEach((slide, i) => {
      let diff = i - active;
      /* wrap-around normalise */
      if (diff < -(N / 2)) diff += N;
      if (diff >  (N / 2)) diff -= N;

      const slot = Math.max(-1, Math.min(1, diff));
      const p    = POS[slot];
      const zi   = diff === 0 ? 10 : 5 - Math.abs(diff);

      slide.style.transform    = `translateX(${p.tx}px) rotateY(${p.ry}deg) scale(${p.sc})`;
      slide.style.opacity      = diff === 0 || Math.abs(diff) === 1 ? p.op : 0;
      slide.style.zIndex       = zi;
      slide.style.pointerEvents = diff === 0 ? 'auto' : 'none';
      slide.classList.toggle('proj-active', diff === 0);
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === active));
  }

  function goTo(idx) {
    active = ((idx % N) + N) % N;
    setPositions();
  }

  prevBtn.addEventListener('click', () => goTo(active - 1));
  nextBtn.addEventListener('click', () => goTo(active + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

  /* Click on side card → go to it (don't follow link) */
  slides.forEach((slide, i) => {
    slide.addEventListener('click', e => {
      if (i !== active) { e.preventDefault(); goTo(i); }
    });
  });

  /* Drag / swipe */
  let startX = 0, pointerDown = false;
  wrap.addEventListener('mousedown',  e => { startX = e.clientX; pointerDown = true; });
  wrap.addEventListener('mouseup',    e => {
    if (!pointerDown) return;
    pointerDown = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 55) goTo(active + (dx < 0 ? 1 : -1));
  });
  wrap.addEventListener('mouseleave', () => { pointerDown = false; });
  wrap.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) goTo(active + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* Arrow keys when projects section is visible */
  document.addEventListener('keydown', e => {
    const sec = document.getElementById('projects');
    if (!sec) return;
    const r = sec.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      if (e.key === 'ArrowLeft')  goTo(active - 1);
      if (e.key === 'ArrowRight') goTo(active + 1);
    }
  });

  setPositions();
})();

/* ── 15. Electric card borders (from 3D_Electric_Cards resource) ─ */
(function initElectricCards() {
  document.querySelectorAll('.work-card').forEach(card => {
    const border = document.createElement('div');
    border.className = 'work-card-electric';
    const glow = document.createElement('div');
    glow.className = 'work-card-electric-glow';
    card.appendChild(border);
    card.appendChild(glow);
  });
})();

/* ── 16. Cursor particle trail (from cursor-particle-trail resource) ─ */
if (!isTouch) {
  const TRAIL_COLORS = ['#6366f1', '#818cf8', '#22d3ee', '#a5b4fc', '#67e8f9', '#c4b5fd'];
  let trailLastX = 0, trailLastY = 0;
  const TRAIL_MIN_DIST = 22; /* px between spawns */

  function spawnTrailParticle(x, y) {
    const el = document.createElement('div');
    el.className = 'cursor-particle';
    const size = Math.random() * 5 + 3;
    el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)]};`;
    document.body.appendChild(el);

    const angle  = Math.random() * Math.PI * 2;
    const speed  = Math.random() * 2.2 + 0.8;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed - 1.2; /* slight upward bias */
    let cx = 0, cy = 0, life = 1;

    function step() {
      life -= 0.032;
      vy   += 0.07; /* gravity */
      vx   *= 0.97;
      cx   += vx;
      cy   += vy;
      if (life <= 0) { el.remove(); return; }
      el.style.opacity   = (life * 0.85).toFixed(3);
      el.style.transform = `translate(${cx}px,${cy}px) scale(${life.toFixed(3)})`;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.addEventListener('mousemove', e => {
    const dx = e.clientX - trailLastX;
    const dy = e.clientY - trailLastY;
    if (dx * dx + dy * dy > TRAIL_MIN_DIST * TRAIL_MIN_DIST) {
      spawnTrailParticle(e.clientX, e.clientY);
      trailLastX = e.clientX;
      trailLastY = e.clientY;
    }
  }, { passive: true });
}

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

/* ── 18. Three.js hero — 3D torus knot (right side, desktop) ─── */
(function initHero3D() {
  if (isTouch) return;
  if (typeof THREE === 'undefined') { console.warn('[hero3D] Three.js not loaded'); return; }

  const container = document.getElementById('hero-3d');
  if (!container) return;

  const scene    = new THREE.Scene();
  const getSize  = () => ({ w: container.offsetWidth, h: container.offsetHeight });
  let { w, h }   = getSize();

  const camera   = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  /* ── meshes ── */
  // Main indigo wireframe torus knot
  const mainKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.2, 0.38, 160, 20, 2, 3),
    new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.70 })
  );
  scene.add(mainKnot);

  // Outer ghost shell (depth / glow illusion)
  const outerKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.28, 0.41, 80, 10, 2, 3),
    new THREE.MeshBasicMaterial({ color: 0xa5b4fc, wireframe: true, transparent: true, opacity: 0.12 })
  );
  scene.add(outerKnot);

  // Inner cyan accent knot (different p/q → different shape)
  const innerKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.78, 0.24, 100, 14, 3, 4),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.35 })
  );
  scene.add(innerKnot);

  /* ── particle cloud ── */
  const PC   = 450;
  const pPos = new Float32Array(PC * 3);
  for (let i = 0; i < PC; i++) {
    const phi   = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r     = 1.9 + Math.random() * 1.4;
    pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const pGeom = new THREE.BufferGeometry();
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pts = new THREE.Points(
    pGeom,
    new THREE.PointsMaterial({ color: 0xa5b4fc, size: 0.022, transparent: true, opacity: 0.55 })
  );
  scene.add(pts);

  /* ── mouse ── */
  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  document.addEventListener('mousemove', e => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ── resize ── */
  window.addEventListener('resize', () => {
    const s = getSize();
    camera.aspect = s.w / s.h;
    camera.updateProjectionMatrix();
    renderer.setSize(s.w, s.h);
  }, { passive: true });

  /* ── animate ── */
  const clock = new THREE.Clock();
  const heroEl = document.getElementById('hero');

  (function frame() {
    requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    // Smooth mouse lerp
    curX += (targetX - curX) * 0.04;
    curY += (targetY - curY) * 0.04;

    // Rotation — auto spin + subtle mouse tilt
    mainKnot.rotation.x  =  t * 0.12 + curY * 0.5;
    mainKnot.rotation.y  =  t * 0.18 + curX * 0.5;
    outerKnot.rotation.x = -t * 0.08 + curY * 0.3;
    outerKnot.rotation.y = -t * 0.14 + curX * 0.3;
    innerKnot.rotation.x =  t * 0.20 - curY * 0.4;
    innerKnot.rotation.y = -t * 0.15 - curX * 0.4;
    pts.rotation.y = t * 0.05;
    pts.rotation.x = t * 0.02;

    // Fade out as user scrolls past hero
    if (heroEl) {
      const fade = Math.max(0, 1 - (window.scrollY / heroEl.offsetHeight) * 1.8);
      renderer.domElement.style.opacity = fade;
    }

    renderer.render(scene, camera);
  })();
})();

/* ── 19. 3D rotating skill tag sphere ───────────────────────────── */
(function initSkillSphere() {
  const container = document.getElementById('skillsSphere');
  if (!container) return;

  const SKILLS_LIST = [
    '.NET / C#', 'ASP.NET Core', 'REST APIs', 'CQRS', 'MediatR',
    'Clean Arch', 'React Native', 'React', 'Vue.js', 'TypeScript',
    'JavaScript', 'Expo', 'Azure DevOps', 'Docker', 'Git',
    'CI/CD', 'PostgreSQL', 'Entity FW', 'SQL Server',
    'Kotlin', 'Python', 'Swift', 'API Versioning', 'Microservices',
  ];

  const N   = SKILLS_LIST.length;
  const R   = 140;   // sphere radius in px
  const FOV = 320;   // perspective strength

  /* Fibonacci sphere — evenly distributed points on a unit sphere */
  const pts = SKILLS_LIST.map((name, i) => {
    const phi   = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return {
      ox: Math.sin(phi) * Math.cos(theta),
      oy: Math.sin(phi) * Math.sin(theta),
      oz: Math.cos(phi),
      name,
    };
  });

  /* Create DOM tags */
  const tags = pts.map(p => {
    const span = document.createElement('span');
    span.className   = 'sphere-tag';
    span.textContent = p.name;
    container.appendChild(span);
    return span;
  });

  /* State */
  let rotX = 0.3, rotY = 0;
  let velX = 0.0008, velY = 0.003;
  let dragging = false, lastMX = 0, lastMY = 0;

  /* Drag / mouse interactions */
  container.addEventListener('mousedown', e => {
    dragging = true;
    lastMX = e.clientX;
    lastMY = e.clientY;
  });
  window.addEventListener('mouseup',   () => { dragging = false; });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    velY = (e.clientX - lastMX) * 0.006;
    velX = (e.clientY - lastMY) * 0.006;
    lastMX = e.clientX;
    lastMY = e.clientY;
  }, { passive: true });

  /* Touch swipe */
  container.addEventListener('touchstart', e => {
    lastMX = e.touches[0].clientX;
    lastMY = e.touches[0].clientY;
    dragging = true;
  }, { passive: true });
  container.addEventListener('touchmove', e => {
    if (!dragging) return;
    velY = (e.touches[0].clientX - lastMX) * 0.004;
    velX = (e.touches[0].clientY - lastMY) * 0.004;
    lastMX = e.touches[0].clientX;
    lastMY = e.touches[0].clientY;
  }, { passive: true });
  container.addEventListener('touchend', () => { dragging = false; });

  /* Rotate a unit-sphere point by (rotX, rotY) Euler angles */
  function rotate(ox, oy, oz, rx, ry) {
    // Y-axis rotation
    const cy = Math.cos(ry), sy = Math.sin(ry);
    const x1 =  ox * cy + oz * sy;
    const z1 = -ox * sy + oz * cy;
    // X-axis rotation
    const cx = Math.cos(rx), sx = Math.sin(rx);
    const y2 =  oy * cx - z1 * sx;
    const z2 =  oy * sx + z1 * cx;
    return { x: x1, y: y2, z: z2 };
  }

  (function frame() {
    requestAnimationFrame(frame);

    // Auto-drift when not dragging; decelerate drag momentum
    if (!dragging) {
      velX *= 0.95;
      velY *= 0.95;
      velY += (0.003 - velY) * 0.01; // drift back to base speed
    }
    rotX += velX;
    rotY += velY;

    const cw = container.offsetWidth  / 2;
    const ch = container.offsetHeight / 2;

    pts.forEach((p, i) => {
      const r     = rotate(p.ox, p.oy, p.oz, rotX, rotY);
      const scale = FOV / (FOV + r.z * R);
      const px    = r.x * R * scale + cw;
      const py    = r.y * R * scale + ch;
      const depth = (r.z + 1) / 2;  // 0 = back, 1 = front

      tags[i].style.transform = `translate(${px}px,${py}px) translate(-50%,-50%)`;
      tags[i].style.fontSize  = `${(9 + depth * 5).toFixed(1)}px`;
      tags[i].style.opacity   = (0.22 + depth * 0.78).toFixed(2);
      tags[i].style.zIndex    = Math.round(depth * 10);
      tags[i].style.color     = depth > 0.55 ? '#a5b4fc' : '#4338ca';
    });
  })();
})();
