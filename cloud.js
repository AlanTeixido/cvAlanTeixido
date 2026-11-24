/* ─────────────────────────────────────────────────────────────────
   cloud.js — the hero's point cloud

   A picture of what the agents on this page do: documents sit in a vector
   space as points, a question lands among them, and the nearest ones are
   retrieved.

     · The cloud drifts slowly and leans a little towards the pointer.
     · Moving the pointer over the hero is a live query: the documents
       nearest to it light up, joined to it by lines.
     · Every command run in the terminal (terminal.js fires `term:run`)
       drops a query of its own, which stays lit longer.
     · Scrolling away scatters the cloud and fades it out.

   Plain WebGL, no library. It starts when the browser is idle and stops
   drawing while the hero is off screen or the tab is hidden. With reduced
   motion nothing moves: only terminal queries light up (a colour change),
   and they stay lit instead of fading. Without WebGL the canvas stays empty.
───────────────────────────────────────────────────────────────── */
(function initCloud() {
  const canvas = document.getElementById('heroCloud');
  if (!canvas) return;

  const POINTS = 1400;
  const CLUSTERS = 9;
  const NEIGHBOURS = 7;         // documents a query retrieves
  const HIT_SECONDS = 6;        // how long a terminal query stays lit
  const HOVER_SECONDS = 1.1;    // how long a pointer query stays lit
  const HOVER_RADIUS = 150;     // px: how far the pointer reaches
  const HOVER_EVERY = 0.07;     // seconds between pointer queries
  const TURN_SECONDS = 240;     // one full rotation
  const CAMERA = 3.4;           // camera distance
  const ZOOM = 2.3;

  const VERTEX = `
    attribute vec3 aPos;
    attribute float aHit;       // when this point's highlight ends
    uniform float uTime, uAngle, uAspect, uSize, uSpread;
    uniform vec2 uCentre;
    varying float vHit, vDepth;
    void main() {
      float c = cos(uAngle), s = sin(uAngle);
      vec3 p = vec3(aPos.x * c + aPos.z * s, aPos.y, aPos.z * c - aPos.x * s);
      p *= 1.0 + uSpread * 1.8;                      // scrolling away scatters it
      float depth = max(p.z + ${CAMERA.toFixed(1)}, 0.4);
      vec2 xy = p.xy / depth * ${ZOOM.toFixed(1)};
      xy.x /= max(uAspect, 1.0);                     // keep it round on wide screens
      xy.y *= min(uAspect, 1.0);                     // and on tall ones
      gl_Position = vec4(xy + uCentre, 0.0, 1.0);
      vHit = clamp(aHit - uTime, 0.0, 1.0);          // fades over the last second
      vDepth = clamp(1.25 - depth / 4.4, 0.25, 1.0) * (1.0 - uSpread);
      gl_PointSize = uSize * (1.0 + vHit * 1.4) / depth;
    }`;

  const FRAGMENT = `
    precision mediump float;
    uniform vec3 uInk, uSignal;
    uniform float uLine;        // 1.0 while drawing a query's lines
    varying float vHit, vDepth;
    void main() {
      float alpha;
      if (uLine > 0.5) {
        alpha = vHit * 0.75;
      } else {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        alpha = mix(0.5 * vDepth, 1.0, vHit) * smoothstep(0.5, 0.36, d);
      }
      vec3 colour = mix(uInk, uSignal, uLine > 0.5 ? 1.0 : vHit);
      gl_FragColor = vec4(colour * alpha, alpha);   // premultiplied
    }`;

  function start() {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, powerPreference: 'low-power' });
    if (!gl) return;

    function shader(type, source) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      return sh;
    }
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const aPos = gl.getAttribLocation(program, 'aPos');
    const aHit = gl.getAttribLocation(program, 'aHit');
    const uniforms = {};
    for (const name of ['uTime', 'uAngle', 'uAspect', 'uSize', 'uSpread', 'uCentre', 'uInk', 'uSignal', 'uLine']) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }

    /* ── The documents: a few loose clusters, like topics in an index ── */
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;
    const centres = Array.from({ length: CLUSTERS }, () => [gauss() * 1.7, gauss() * 1.2, gauss() * 1.7]);
    const pos = new Float32Array(POINTS * 3);
    for (let i = 0; i < POINTS; i++) {
      const cluster = centres[i % CLUSTERS];
      const spread = i % 5 === 0 ? 1.1 : 0.42;       // one in five strays between clusters
      pos[i * 3]     = cluster[0] + gauss() * spread;
      pos[i * 3 + 1] = cluster[1] + gauss() * spread;
      pos[i * 3 + 2] = cluster[2] + gauss() * spread;
    }
    const NEVER = -1e4;
    const hit = new Float32Array(POINTS).fill(NEVER);   // per document: when its highlight ends

    function buffer(data, usage) {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      return b;
    }
    const posBuffer = buffer(pos, gl.STATIC_DRAW);
    const hitBuffer = buffer(hit, gl.DYNAMIC_DRAW);

    /* A query is its own point plus one line to each document it retrieved:
       vertex pairs [query, document]. There are two, the terminal's and the
       pointer's, so one doesn't erase the other. */
    function makeQuery() {
      const q = { pos: new Float32Array(NEIGHBOURS * 6), hit: new Float32Array(NEIGHBOURS * 2).fill(NEVER) };
      q.posBuffer = buffer(q.pos, gl.DYNAMIC_DRAW);
      q.hitBuffer = buffer(q.hit, gl.DYNAMIC_DRAW);
      return q;
    }
    const typed = makeQuery(), hovered = makeQuery();

    const css = getComputedStyle(document.documentElement);
    const rgb = name => {
      const hex = css.getPropertyValue(name).trim().replace('#', '');
      return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    };
    gl.uniform3fv(uniforms.uInk, rgb('--ink'));
    gl.uniform3fv(uniforms.uSignal, rgb('--signal'));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aHit);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hero = canvas.closest('section') || canvas;
    let aspect = 1, centre = [0, 0], dpr = 1;
    let now = 0, litUntil = NEVER, frame = 0, onScreen = true, visible = true;
    let angle = 0.6, spread = 0;
    const pointer = { x: 0, y: 0, inside: false, lean: 0, queriedAt: 0 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (!w || !h || (canvas.width === w && canvas.height === h)) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      aspect = w / h;
      /* Beside the headline on wide screens, down by the terminal on narrow ones */
      centre = aspect > 1.2 ? [0.3, 0] : [0.2, -0.45];
      gl.uniform1f(uniforms.uAspect, aspect);
      gl.uniform2fv(uniforms.uCentre, centre);
    }

    /* The vertex shader's projection, repeated here to know where a document
       is on screen: [x, y] in CSS pixels on the canvas, plus its depth */
    function project(i) {
      const c = Math.cos(angle), s = Math.sin(angle), k = 1 + spread * 1.8;
      const x = (pos[i] * c + pos[i + 2] * s) * k;
      const depth = Math.max((pos[i + 2] * c - pos[i] * s) * k + CAMERA, 0.4);
      const cx = (x / depth * ZOOM) / Math.max(aspect, 1) + centre[0];
      const cy = (pos[i + 1] * k / depth * ZOOM) * Math.min(aspect, 1) + centre[1];
      return [(cx + 1) / 2 * canvas.clientWidth, (1 - cy) / 2 * canvas.clientHeight, depth];
    }
    /* And backwards: the point in the cloud under a screen position, at a given depth */
    function unproject(x, y, depth) {
      const cx = x / canvas.clientWidth * 2 - 1, cy = 1 - y / canvas.clientHeight * 2;
      const k = 1 + spread * 1.8;
      const xr = (cx - centre[0]) * Math.max(aspect, 1) * depth / ZOOM / k;
      const yr = (cy - centre[1]) / Math.min(aspect, 1) * depth / ZOOM / k;
      const zr = (depth - CAMERA) / k;
      const c = Math.cos(angle), s = Math.sin(angle);
      return [xr * c - zr * s, yr, xr * s + zr * c];
    }

    /* Light up `documents` (indices into pos) around the point `from` until `until` */
    function light(query, from, documents, until) {
      query.hit.fill(NEVER);
      documents.forEach((i, n) => {
        hit[i / 3] = Math.max(hit[i / 3], until);
        query.pos.set(from, n * 6);
        query.pos.set(pos.subarray(i, i + 3), n * 6 + 3);
        query.hit[n * 2] = query.hit[n * 2 + 1] = until;
      });
      if (!documents.length) query.pos.set(from, 0);
      query.hit[0] = until;                          // vertex 0 is drawn as the query's own point
      gl.bindBuffer(gl.ARRAY_BUFFER, hitBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, hit);
      gl.bindBuffer(gl.ARRAY_BUFFER, query.posBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, query.pos);
      gl.bindBuffer(gl.ARRAY_BUFFER, query.hitBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, query.hit);
      litUntil = Math.max(litUntil, until);
    }

    /* Boxes a query shouldn't land on: the terminal hides it and text gets harder to read */
    const covers = () => [...hero.querySelectorAll('.hero-term, .hero-content')].map(el => el.getBoundingClientRect());
    const isCovered = (boxes, pageX, pageY, margin) =>
      boxes.some(b => pageX > b.left - margin && pageX < b.right + margin && pageY > b.top - margin && pageY < b.bottom + margin);

    /* Terminal query: lands next to a document the visitor can see, and
       retrieves its nearest neighbours in the cloud's own space */
    function retrieve() {
      now = performance.now() / 1000;
      const boxes = covers(), area = canvas.getBoundingClientRect();
      let seed = 0;
      for (let tries = 0; tries < 40; tries++) {
        seed = Math.floor(Math.random() * POINTS) * 3;
        const [x, y] = project(seed);
        const inFrame = x > 40 && x < area.width - 40 && y > 80 && y < area.height - 40;
        if (inFrame && !isCovered(boxes, x + area.left, y + area.top, 24)) break;
      }
      const q = [pos[seed] + gauss() * 0.2, pos[seed + 1] + gauss() * 0.2, pos[seed + 2] + gauss() * 0.2];
      const byDistance = [];
      for (let i = 0; i < POINTS * 3; i += 3) {
        const dx = pos[i] - q[0], dy = pos[i + 1] - q[1], dz = pos[i + 2] - q[2];
        byDistance.push([dx * dx + dy * dy + dz * dz, i]);
      }
      byDistance.sort((a, b) => a[0] - b[0]);

      if (reduceMotion.matches) hit.fill(NEVER);     // no fade there: clear the previous one
      light(typed, q, byDistance.slice(0, NEIGHBOURS).map(d => d[1]), now + HIT_SECONDS);
      wake();
    }

    /* Pointer query: the documents nearest to the pointer on screen */
    function hover() {
      pointer.queriedAt = now;
      const area = canvas.getBoundingClientRect();
      const px = pointer.x - area.left, py = pointer.y - area.top;
      if (isCovered(covers().slice(0, 1), pointer.x, pointer.y, 0)) return;   // over the terminal
      const near = [];
      for (let i = 0; i < POINTS * 3; i += 3) {
        const [x, y, depth] = project(i);
        const d = Math.hypot(x - px, y - py);
        if (d < HOVER_RADIUS) near.push([d, i, depth]);
      }
      if (!near.length) return;
      near.sort((a, b) => a[0] - b[0]);
      const found = near.slice(0, NEIGHBOURS);
      const depth = found.reduce((sum, d) => sum + d[2], 0) / found.length;
      light(hovered, unproject(px, py, depth), found.map(d => d[1]), now + HOVER_SECONDS);
    }

    function bind(positions, hits) {
      gl.bindBuffer(gl.ARRAY_BUFFER, positions);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, hits);
      gl.vertexAttribPointer(aHit, 1, gl.FLOAT, false, 0, 0);
    }

    function draw() {
      const still = reduceMotion.matches;
      /* With reduced motion the clock stops just before the highlight ends,
         so a terminal query stays fully lit instead of fading */
      gl.uniform1f(uniforms.uTime, still ? Math.max(litUntil - 1, 0) : now);
      gl.uniform1f(uniforms.uAngle, angle);
      gl.uniform1f(uniforms.uSpread, spread);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uniforms.uLine, 0);
      gl.uniform1f(uniforms.uSize, 13 * dpr);
      bind(posBuffer, hitBuffer);
      gl.drawArrays(gl.POINTS, 0, POINTS);

      for (const query of [typed, hovered]) {
        bind(query.posBuffer, query.hitBuffer);
        gl.uniform1f(uniforms.uLine, 1);
        gl.drawArrays(gl.LINES, 0, NEIGHBOURS * 2);
        gl.uniform1f(uniforms.uLine, 0);
        gl.uniform1f(uniforms.uSize, 20 * dpr);
        gl.drawArrays(gl.POINTS, 0, 1);
      }
    }

    function loop(ms) {
      now = ms / 1000;
      const still = reduceMotion.matches;
      if (!still) {
        /* Ease towards the pointer, so the cloud leans instead of jumping */
        const lean = pointer.inside ? (pointer.x / window.innerWidth - 0.5) * 0.35 : 0;
        pointer.lean += (lean - pointer.lean) * 0.04;
        angle = 0.6 + (now / TURN_SECONDS) * Math.PI * 2 + pointer.lean;
        spread = Math.min(Math.max(window.scrollY / (hero.offsetHeight || 1), 0), 1);
        if (pointer.inside && spread < 0.25 && now - pointer.queriedAt > HOVER_EVERY) hover();
      }
      draw();
      /* Keep drawing while it moves, or while a query is still fading */
      frame = visible && (!still || now < litUntil) ? requestAnimationFrame(loop) : 0;
    }
    function wake() {
      if (!frame && visible) frame = requestAnimationFrame(loop);
    }
    function updateVisible() {
      visible = onScreen && !document.hidden;
      wake();
    }

    new ResizeObserver(() => { resize(); wake(); }).observe(canvas);
    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; updateVisible(); }).observe(canvas);
    document.addEventListener('visibilitychange', updateVisible);
    reduceMotion.addEventListener('change', wake);
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(frame); onScreen = false; visible = false; });
    window.addEventListener('term:run', retrieve);

    /* The canvas takes no input (the hero's content sits on top of it), so
       the pointer is followed on the hero itself. Mouse and pen only. */
    if (window.matchMedia('(pointer: fine)').matches) {
      hero.addEventListener('pointermove', e => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.inside = true;
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { pointer.inside = false; });
    }

    resize();
    canvas.classList.add('is-ready');
    wake();
    setTimeout(retrieve, 1400);                     // one retrieval to show what the dots are
  }

  /* The first screen's text and terminal come first */
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 });
  else setTimeout(start, 300);
})();
