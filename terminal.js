/* ─────────────────────────────────────────────────────────────────
   terminal.js — the hero's status terminal, made interactive

   Type a command (help, about, experience, projects, stack, contact, cv…)
   and it answers with the same facts as the page; `ask` (or any question
   typed straight in) goes to the AI assistant in api/ask.py. Commands shown
   in the output are buttons, so it also works by tapping on a phone. ↑/↓
   walk the history, Tab completes. On desktop the window can be dragged.

   Output is built from DOM nodes and textContent only: what the visitor
   types is never parsed as HTML.
───────────────────────────────────────────────────────────────── */
(function initTerminal() {
  const term = document.querySelector('.hero-term');
  const body = term && term.querySelector('.term-body');
  const staticPrompt = body && body.querySelector('.term-prompt-line');
  if (!staticPrompt) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX_LINES = 120;

  /* ── Build: output area + a real input where the static caret was ── */
  const out = document.createElement('div');
  out.className = 'term-out';
  out.setAttribute('aria-live', 'polite');
  body.insertBefore(out, staticPrompt);

  const form = document.createElement('form');
  form.className = 'term-prompt-line';
  const sign = document.createElement('span');
  sign.className = 'term-prompt';
  sign.setAttribute('aria-hidden', 'true');
  sign.textContent = '$';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'term-input';
  input.placeholder = 'type help and press Enter';
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('enterkeyhint', 'send');
  input.setAttribute('aria-label', 'Terminal: type a command, for example help');
  form.append(sign, input);
  staticPrompt.replaceWith(form);

  /* The suggested commands under the status lines become buttons too (they
     are plain spans in the HTML so the page doesn't shift when this runs) */
  body.querySelectorAll('.term-chip').forEach(chip => chip.replaceWith(cmd(chip.textContent.trim())));

  /* First visit: the prompt appears once the intro has typed the status
     lines (style.css hides it until --prompt-at) */
  const lastChar = body.querySelector('.tch.is-last');
  if (lastChar) {
    const at = parseFloat(lastChar.style.getPropertyValue('--d')) || 0;
    body.style.setProperty('--prompt-at', `${at + 700}ms`);
  }

  /* ── Output helpers ──────────────────────────────────────────── */
  function line(...parts) {
    const p = document.createElement('p');
    p.className = 'term-line';
    p.append(...parts);
    return p;
  }
  function span(text, cls) {
    const s = document.createElement('span');
    if (cls) s.className = cls;
    s.textContent = text;
    return s;
  }
  /* A command you can tap */
  function cmd(name, label = name) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'term-btn';
    b.textContent = label;
    b.addEventListener('click', () => run(name));
    return b;
  }
  function link(text, href, { external = false, download = false } = {}) {
    const a = document.createElement('a');
    a.className = 'term-link';
    a.href = href;
    a.textContent = text;
    if (external) { a.target = '_blank'; a.rel = 'noopener'; }
    if (download) a.setAttribute('download', '');
    return a;
  }
  const arrow = () => span('→ ', 'term-arrow');
  const pad = (text, width) => span(text.padEnd(width), 'term-key');

  function goTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* ── Content (same facts as the page) ────────────────────────── */
  const SECTIONS = ['about', 'experience', 'projects', 'education', 'skills', 'goals', 'contact'];

  const COMMANDS = {
    help: {
      desc: 'list commands',
      run: () => [
        line(span('Commands (type or tap):', 'term-muted')),
        ...['ask', 'about', 'experience', 'projects', 'stack', 'education', 'goals', 'contact', 'cv', 'clear']
          .map(name => line(cmd(name), span(` ${' '.repeat(Math.max(0, 11 - name.length))}${COMMANDS[name].desc}`, 'term-muted'))),
        line(span('Also: ls, cd <section>, whoami, date. ↑ ↓ history, Tab completes.', 'term-muted')),
      ],
    },
    ask: {
      desc: 'ask the AI about me',
      run: question => ask(question),
    },
    about: {
      desc: 'who I am',
      run: () => [
        line('Fullstack & AI engineer based in Barcelona. I build AI agents that answer from company knowledge (Google ADK, Vertex AI, RAG), the Python and .NET APIs behind them, and React / React Native apps on top.'),
        line(arrow(), cmd('cd about', 'open section')),
      ],
    },
    experience: {
      desc: "where I've worked",
      run: () => [
        ...[
          ['2025 – now ', 'Plain Concepts', 'Software Engineer, Fullstack & AI'],
          ['2024 – 2025', 'Quantion', 'Backend Developer (.NET), internship'],
          ['2024       ', 'SJAS Summer Camp', 'Camp Counselor'],
          ['2022       ', 'CamperXpress', 'Sales Representative & Web Developer'],
          ['2021 – 2022', 'Pista Cero Informática', 'Hardware Technician'],
        ].map(([when, where, what]) => line(span(when + '  ', 'term-muted'), span(where, 'term-strong'), ` · ${what}`)),
        line(arrow(), cmd('cd experience', 'open section')),
      ],
    },
    projects: {
      desc: "things I've built",
      run: () => [
        line(arrow(), link('GenAI Data Platform', 'projects.html#genai-data-platform'),
          span(' — questions in plain English become governed SQL and Metabase dashboards', 'term-muted')),
        line(arrow(), link('Fit', 'https://fit.alanteixido.dev', { external: true }),
          span(' — training app with an AI coach (Next.js, Supabase, Claude API)', 'term-muted')),
        line(arrow(), link('ProTactics', 'https://github.com/AlanTeixido/ProTactics', { external: true }),
          span(' — football club management platform (Vue 3, Node.js, PostgreSQL)', 'term-muted')),
        line(arrow(), link('all projects', 'projects.html')),
      ],
    },
    stack: {
      desc: 'tools I use',
      run: () => [
        ['AI', 'Google ADK · Vertex AI · RAG · Azure Bot Service'],
        ['Backend', '.NET (C#) · Python · FastAPI · Clean Architecture · CQRS'],
        ['Frontend', 'React · Next.js · TypeScript · Vue.js · Tailwind CSS'],
        ['Mobile', 'React Native · Expo · Kotlin · Firebase'],
        ['Cloud', 'Azure · Azure DevOps · Google Cloud · Docker'],
        ['Data', 'PostgreSQL · Entity Framework Core · SQL'],
      ].map(([group, tools]) => line(pad(group, 10), tools)),
    },
    education: {
      desc: 'where I studied',
      run: () => [
        line(span('2024 – 2025  ', 'term-muted'), span('CFGS DAW', 'term-strong'), ' · Web Application Development · Institut Tecnològic de Barcelona'),
        line(span('2021 – 2023  ', 'term-muted'), span('CFGM SMX', 'term-strong'), ' · Microcomputer Systems & Networks · IFP Hospitalet'),
        line(span('2013 – 2020  ', 'term-muted'), span('SEK Catalunya', 'term-strong'), ' · Primary & Secondary Education'),
      ],
    },
    goals: {
      desc: "what's next",
      run: () => [
        line('I already ship AI agents to production. Next, I want to make them reliable at scale: evaluating answer quality, observability, grounding and guardrails, and keeping latency and cost under control.'),
        line(arrow(), cmd('cd goals', 'open section')),
      ],
    },
    contact: {
      desc: 'how to reach me',
      run: () => [
        line(pad('email', 10), link('teixido.alan@gmail.com', 'mailto:teixido.alan@gmail.com')),
        line(pad('linkedin', 10), link('in/alanteixidosararols', 'https://www.linkedin.com/in/alanteixidosararols', { external: true })),
        line(pad('github', 10), link('AlanTeixido', 'https://github.com/AlanTeixido', { external: true })),
      ],
    },
    cv: {
      desc: 'download my CV',
      run: () => [line(arrow(), link('Alan_Teixido_CV.pdf', '/cv/Alan_Teixido_CV.pdf', { download: true }), span('  (PDF)', 'term-muted'))],
    },
    clear: {
      desc: 'clear the screen',
      run: () => { out.replaceChildren(); body.classList.add('is-cleared'); return []; },
    },

    /* Not listed in help, but a terminal wouldn't be one without them */
    ls: { run: () => [line(['about.md', 'experience.md', 'projects/', 'stack.md', 'education.md', 'goals.md', 'contact.md', 'cv.pdf'].join('  '))] },
    whoami: { run: () => [line('guest. Hiring? Try ', cmd('contact'))] },
    pwd: { run: () => [line('/home/alan/barcelona')] },
    date: { run: () => [line(new Date().toString())] },
    sudo: { run: () => [line('guest is not in the sudoers file. This incident will be reported… to my inbox: ', cmd('contact'))] },
    rm: { run: () => [line('rm: refusing to delete a CV that is still job hunting')] },
    exit: { run: () => [line("There's no exit, only ", cmd('contact'), ' or ', cmd('cv'))] },
    hello: { run: () => [line('Hi! Type ', cmd('help'), ' to see what I can do.')] },
  };

  const ALIASES = {
    work: 'experience', exp: 'experience', jobs: 'experience',
    skills: 'stack', tech: 'stack',
    email: 'contact', mail: 'contact', social: 'contact',
    resume: 'cv', 'cv.pdf': 'cv',
    studies: 'education', edu: 'education',
    man: 'help', '?': 'help', commands: 'help',
    hi: 'hello', hola: 'hello', hey: 'hello',
    logout: 'exit', quit: 'exit', cls: 'clear',
    ai: 'ask', chat: 'ask',
  };
  const COMPLETIONS = [...Object.keys(COMMANDS).filter(c => c !== 'ask'), 'ask ', 'cd ', 'cat ', 'echo '];

  /* ── ask: the AI assistant (api/ask.py behind /api/ask) ─────────
     The answer streams in as plain text. Anything that goes wrong becomes
     one friendly line pointing to the static commands. */
  const EXAMPLES = ['what has Alan built with RAG?', 'which cloud platforms has he worked with?', 'is he open to new roles?'];
  const QUESTION_WORDS = /^(what|which|who|how|why|where|when|does|did|is|are|can|has|have|tell|qu[eé]|c[oó]mo|qui[eé]n|d[oó]nde|cu[aá]l|tiene|sabe|es)\b/i;
  let asking = false;

  function ask(question) {
    if (!question) {
      return [
        line('Ask anything about my experience, projects or skills. ', span('Answers are AI-generated from my CV.', 'term-muted')),
        ...EXAMPLES.map(q => line(arrow(), cmd(`ask ${q}`, q))),
      ];
    }
    if (asking) return [line(span('Still answering the previous question…', 'term-muted'))];
    const answer = span('', 'term-answer');
    const thinking = span('thinking', 'term-thinking');
    answer.append(thinking);
    streamAnswer(question, answer, thinking);
    return [line(arrow(), answer)];
  }

  async function streamAnswer(question, answer, thinking) {
    asking = true;
    out.setAttribute('aria-busy', 'true');        // screen readers wait for the full answer
    let text = '';
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        answer.textContent = text;                 // replaces "thinking" on the first chunk
        body.scrollTop = body.scrollHeight;
      }
      text += decoder.decode();
      if (!text.trim()) throw new Error('empty');
      answer.textContent = text;
    } catch (err) {
      thinking.remove();
      answer.replaceChildren(...failure(Number(err.message)));
    } finally {
      asking = false;
      out.removeAttribute('aria-busy');
      body.scrollTop = body.scrollHeight;
    }
  }

  function failure(status) {
    if (status === 429) return [span("That's a lot of questions for today. Ask Alan directly: ", 'term-muted'), cmd('contact')];
    if (status === 400) return [span('Try a shorter question (300 characters max).', 'term-muted')];
    return [span('The assistant is offline right now. Try ', 'term-muted'), cmd('about'), ' ', cmd('projects'), ' or ', cmd('contact')];
  }

  /* ── Run a command ───────────────────────────────────────────── */
  function resolve(raw) {
    const [word = '', ...rest] = raw.trim().split(/\s+/);
    const name = word.toLowerCase();
    const arg = rest.join(' ');

    if (name === 'cd' || name === 'open') {
      const target = arg.toLowerCase().replace(/[/.]|md$/g, '');
      const id = target === 'stack' ? 'skills' : target;
      if (SECTIONS.includes(id)) { goTo(id); return [line(span(`→ #${id}`, 'term-muted'))]; }
      if (!target || target === '~') return [line(span('already home', 'term-muted'))];
      return [line(`cd: no such section: ${arg}. Try `, cmd('ls'))];
    }
    if (name === 'cat') {
      const file = arg.toLowerCase().replace(/\.(md|pdf)$|\/$/g, '');
      const target = ALIASES[file] || file;
      if (COMMANDS[target] && COMMANDS[target].desc) return COMMANDS[target].run();
      return [line(`cat: ${arg || 'missing file'}: no such file. Try `, cmd('ls'))];
    }
    if (name === 'echo') return [line(arg)];

    const key = COMMANDS[name] ? name : ALIASES[name];
    if (key) return COMMANDS[key].run(arg);
    /* Someone typed a question straight in: hand it to the assistant */
    if (arg && (raw.trim().endsWith('?') || QUESTION_WORDS.test(raw.trim()))) return ask(raw.trim());
    return [line(`command not found: ${word}. Type `, cmd('help'), ' or ', cmd('ask'), ' a question')];
  }

  const history = [];
  let historyAt = 0;

  function run(raw) {
    const text = raw.trim();
    if (!text) return;
    history.push(text);
    historyAt = history.length;

    body.classList.remove('is-cleared');
    out.append(line(span('$ ', 'term-prompt'), span(text, 'term-cmd')));
    out.append(...resolve(text));
    while (out.childElementCount > MAX_LINES) out.firstElementChild.remove();
    body.scrollTop = body.scrollHeight;
  }

  /* ── Input: Enter, history, completion ───────────────────────── */
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value;
    input.value = '';
    run(text);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!history.length) return;
      e.preventDefault();
      historyAt = Math.max(0, Math.min(history.length, historyAt + (e.key === 'ArrowUp' ? -1 : 1)));
      input.value = history[historyAt] || '';
    } else if (e.key === 'Tab' && input.value.trim()) {
      const typed = input.value.toLowerCase();
      const matches = COMPLETIONS.filter(c => c.startsWith(typed));
      if (matches.length) {
        e.preventDefault();
        if (matches.length === 1) input.value = matches[0];
        else out.append(line(span(matches.join('  '), 'term-muted')));
        body.scrollTop = body.scrollHeight;
      }
      /* no match: let Tab move focus as usual */
    }
  });

  /* ── Drag the window by its title bar (mouse and pen only) ─────
     Uses the `translate` property, which the intro's `transform` animation
     can't override. The window stays inside the hero and below the navbar;
     double-click the bar to send it back. Touch screens just scroll. */
  const bar = term.querySelector('.term-bar');
  if (bar && window.matchMedia('(pointer: fine)').matches) {
    const hero = term.closest('section') || document.body;
    const navbar = document.getElementById('navbar');
    const EDGE = 8;
    let x = 0, y = 0, startX = 0, startY = 0, fromX = 0, fromY = 0, box = null;
    bar.title = 'Drag to move · double-click to reset';

    /* Say so: a "drag" label on the bar, and once per session a small wobble
       when the window is ready (skipped with reduced motion) */
    const hint = document.createElement('span');
    hint.className = 'term-drag-hint';
    const moveIcon = document.createElement('i');
    moveIcon.className = 'fa-solid fa-up-down-left-right';
    hint.append(moveIcon, ' drag me');
    bar.append(hint);
    let nudged = true;
    try { nudged = sessionStorage.getItem('at-term-nudge') === '1'; sessionStorage.setItem('at-term-nudge', '1'); } catch (e) {}
    if (!nudged && !reduceMotion) {
      const promptAt = parseFloat(body.style.getPropertyValue('--prompt-at')) || 0;
      setTimeout(() => {
        if (x || y || term.classList.contains('is-dragging')) return;   // already found it
        term.classList.add('is-nudging');
        term.addEventListener('animationend', () => term.classList.remove('is-nudging'), { once: true });
      }, (promptAt || 600) + 900);
    }

    /* Where the window may go, from its untranslated box and the hero's */
    function bounds() {
      const r = term.getBoundingClientRect(), h = hero.getBoundingClientRect();
      const left = r.left - x, top = r.top - y;
      const navBottom = navbar ? navbar.getBoundingClientRect().bottom : 0;
      return {
        minX: h.left + EDGE - left,
        maxX: h.right - EDGE - (left + r.width),
        minY: Math.max(h.top, navBottom) + EDGE - top,
        maxY: h.bottom - EDGE - (top + r.height),
      };
    }
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
    function moveTo(nx, ny) {
      x = clamp(nx, box.minX, box.maxX);
      y = clamp(ny, box.minY, box.maxY);
      term.style.translate = x || y ? `${x}px ${y}px` : '';
    }

    bar.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault();                 // no text selection while dragging
      box = bounds();                     // measured before the "lifted" scale
      startX = e.clientX; startY = e.clientY; fromX = x; fromY = y;
      bar.setPointerCapture(e.pointerId);
      term.classList.add('is-dragging');
    });
    bar.addEventListener('pointermove', e => {
      if (!term.classList.contains('is-dragging')) return;
      moveTo(fromX + e.clientX - startX, fromY + e.clientY - startY);
    });
    const drop = () => term.classList.remove('is-dragging');
    bar.addEventListener('pointerup', drop);
    bar.addEventListener('pointercancel', drop);
    bar.addEventListener('dblclick', () => { box = bounds(); moveTo(0, 0); });

    /* A smaller window could leave it outside the hero: pull it back in */
    window.addEventListener('resize', () => {
      if (!x && !y) return;
      box = bounds();
      moveTo(x, y);
    }, { passive: true });
  }

  /* Clicking the terminal's empty space puts the cursor in the prompt */
  term.addEventListener('click', e => {
    if (e.target.closest('a, button, input')) return;
    if (window.getSelection().toString()) return;   // let people copy text
    input.focus({ preventScroll: true });
  });
})();
