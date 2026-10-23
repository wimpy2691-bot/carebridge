/* =====================================================
   CareBridge Elders Support Foundation: site behaviour
   Plain JavaScript, no dependencies.
   ===================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Office WhatsApp number (international format, no plus sign)
  const WHATSAPP_NUMBER = '2349160766586';

  // localStorage can be blocked (private mode, strict settings), so never assume it works
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------- Footer year ---------- */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Header: shadow on scroll + mobile menu ---------- */
  const header = $('.site-header');
  const nav = $('#nav');
  const menuBtn = $('.menu-btn');
  const toTop = $('#to-top');

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 8);
    toTop.hidden = y < 700;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.menu-label', menuBtn).textContent = open ? 'Close' : 'Menu';
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 1180 && !document.documentElement.classList.contains('compact')) setMenu(false); });

  toTop.addEventListener('click', () => window.scrollTo({ top: 0 }));

  /* ---------- Highlight current section in the nav ---------- */
  const navLinks = $$('.nav a[href^="#"]:not(.btn)');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- Reading options: text size + high contrast ---------- */
  const SIZES = [100, 112.5, 125, 143.75];  // percent of the browser's default text size
  let sizeIdx = parseInt(store.get('cb-size'), 10);
  if (!(sizeIdx >= 0 && sizeIdx < SIZES.length)) sizeIdx = 0;

  const applySize = () => {
    document.documentElement.style.fontSize = SIZES[sizeIdx] + '%';
    // bigger text needs the compact menu, because the desktop nav no longer fits
    document.documentElement.classList.toggle('compact', sizeIdx >= 1);
    if (sizeIdx === 0 && window.innerWidth > 1180) setMenu(false);
    store.set('cb-size', sizeIdx);
  };
  applySize();

  $('#size-up').addEventListener('click',   () => { sizeIdx = Math.min(sizeIdx + 1, SIZES.length - 1); applySize(); });
  $('#size-down').addEventListener('click', () => { sizeIdx = Math.max(sizeIdx - 1, 0); applySize(); });
  $('#size-reset').addEventListener('click',() => { sizeIdx = 0; applySize(); });

  const contrastBtn = $('#contrast');
  const setContrast = (on) => {
    document.body.classList.toggle('hc', on);
    contrastBtn.setAttribute('aria-checked', String(on));
    store.set('cb-contrast', on ? '1' : '0');
  };
  contrastBtn.addEventListener('click', () => setContrast(!document.body.classList.contains('hc')));
  setContrast(store.get('cb-contrast') === '1');

  const a11yToggle = $('#a11y-toggle');
  const a11yPanel = $('#a11y-panel');
  const setPanel = (open) => {
    a11yPanel.hidden = !open;
    a11yToggle.setAttribute('aria-expanded', String(open));
  };
  a11yToggle.addEventListener('click', () => setPanel(a11yPanel.hidden));
  document.addEventListener('click', (e) => { if (!a11yPanel.hidden && !e.target.closest('#a11y')) setPanel(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !a11yPanel.hidden) { setPanel(false); a11yToggle.focus(); } });

  /* ---------- Listen to the founder's message (text to speech) ---------- */
  const listenBtn = $('#listen');
  if (listenBtn && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
    listenBtn.hidden = false;
    const label = $('span', listenBtn);
    const synth = window.speechSynthesis;

    const stop = () => {
      synth.cancel();
      listenBtn.setAttribute('aria-pressed', 'false');
      label.textContent = 'Listen to this message';
    };

    listenBtn.addEventListener('click', () => {
      if (listenBtn.getAttribute('aria-pressed') === 'true') { stop(); return; }
      const text = $$('#founder-text p').map(p => p.textContent.trim()).join(' ');
      const u = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
      const v = voices.find(x => /en-NG/i.test(x.lang)) || voices.find(x => /en-GB/i.test(x.lang)) || voices.find(x => /^en/i.test(x.lang));
      if (v) u.voice = v;
      u.lang = (v && v.lang) || 'en-GB';
      u.rate = 0.9;
      u.onend = u.onerror = stop;
      synth.cancel();
      synth.speak(u);
      listenBtn.setAttribute('aria-pressed', 'true');
      label.textContent = 'Stop listening';
    });
    window.addEventListener('pagehide', () => synth.cancel());
  }

  /* ---------- Objectives filter ---------- */
  const objItems = $$('#obj-list .obj');
  const objCount = $('#obj-count');
  const objBtns = $$('[data-filter]');
  const objLabels = {
    dignity: 'Dignity and protection',
    health: 'Health and wellbeing',
    connection: 'Connection',
    partners: 'Partnerships and policy'
  };

  objBtns.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    objBtns.forEach(b => {
      const on = b === btn;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    let shown = 0;
    objItems.forEach(li => {
      const match = f === 'all' || li.dataset.group === f;
      li.hidden = !match;
      if (match) {
        li.style.animation = 'none';
        void li.offsetHeight;                       // restart the entrance animation
        li.style.animation = '';
        li.style.animationDelay = (shown * 45) + 'ms';
        shown++;
      }
    });
    objCount.textContent = f === 'all'
      ? 'Showing all 10 objectives'
      : `Showing ${shown} of 10 objectives: ${objLabels[f]}`;
  }));

  /* ---------- Gallery filter ---------- */
  const gItems = $$('#g-grid .g-item');
  $$('[data-gfilter]').forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.gfilter;
    $$('[data-gfilter]').forEach(b => {
      const on = b === btn;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    gItems.forEach(it => { it.hidden = !(f === 'all' || it.dataset.cat === f); });
  }));

  /* ---------- Lightbox (photos, videos, flyers) ---------- */
  const lb = $('#lb');
  const lbMedia = $('#lb-media');
  const lbCap = $('#lb-caption');
  const lbPrev = $('#lb-prev');
  const lbNext = $('#lb-next');
  const lbClose = $('#lb-close');
  let lbList = [];
  let lbIndex = 0;
  let lastFocus = null;

  const clearMedia = () => {
    const vid = $('video', lbMedia);
    if (vid) vid.pause();
    lbMedia.innerHTML = '';
  };

  const render = () => {
    const el = lbList[lbIndex];
    clearMedia();
    let node;
    if (el.dataset.type === 'video') {
      node = document.createElement('video');
      node.src = el.dataset.src;
      node.poster = el.dataset.poster || '';
      node.controls = true;
      node.autoplay = true;
      node.playsInline = true;
      node.setAttribute('aria-label', el.dataset.caption || 'Video');
    } else {
      node = document.createElement('img');
      node.src = el.dataset.src;
      node.alt = el.dataset.caption || '';
    }
    lbMedia.appendChild(node);
    lbCap.textContent = el.dataset.caption || '';
    const multi = lbList.length > 1;
    lbPrev.hidden = lbNext.hidden = !multi;
  };

  const openLb = (el) => {
    const group = el.dataset.group;
    lbList = $$(`[data-lightbox][data-group="${group}"]`).filter(x => !x.hidden);
    lbIndex = Math.max(0, lbList.indexOf(el));
    lastFocus = el;
    render();
    lb.hidden = false;
    document.body.classList.add('lock');
    lbClose.focus();
  };

  const closeLb = () => {
    clearMedia();
    lb.hidden = true;
    document.body.classList.remove('lock');
    if (lastFocus) lastFocus.focus();
  };

  const step = (d) => {
    if (lbList.length < 2) return;
    lbIndex = (lbIndex + d + lbList.length) % lbList.length;
    render();
  };

  $$('[data-lightbox]').forEach(el => el.addEventListener('click', () => openLb(el)));
  lbClose.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', () => step(-1));
  lbNext.addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-stage')) closeLb(); });

  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Tab') {                    // keep keyboard focus inside the viewer
      const f = [lbClose, lbPrev, lbNext, $('video', lbMedia)].filter(x => x && !x.hidden);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  let touchX = null;                               // swipe left or right on phones
  lb.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });

  /* ---------- Ways to help: choose one, form follows ---------- */
  const form = $('#inv-form');
  const interest = $('#f-interest');
  const ways = $$('.way');

  ways.forEach(w => w.addEventListener('click', () => {
    ways.forEach(x => x.classList.toggle('is-picked', x === w));
    const opt = Array.from(interest.options).find(o => o.value === w.dataset.interest);
    if (opt) interest.value = opt.value;
    form.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), 450);
  }));

  /* ---------- Contact form: opens WhatsApp with the message ready ---------- */
  const status = $('#form-status');
  const setErr = (field, msg) => {
    const wrap = field.closest('.field');
    wrap.classList.toggle('invalid', !!msg);
    $('.err', wrap).textContent = msg || '';
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#f-name');
    const phone = $('#f-phone');
    const msg = $('#f-msg');
    status.textContent = '';

    let ok = true;
    if (!name.value.trim()) { setErr(name, 'Please enter your name.'); ok = false; } else setErr(name, '');
    if (phone.value.replace(/\D/g, '').length < 10) { setErr(phone, 'Please enter a phone number with at least 10 digits.'); ok = false; } else setErr(phone, '');
    if (!ok) { (name.value.trim() ? phone : name).focus(); return; }

    const text =
      'Hello CareBridge Elders Support Foundation,\n\n' +
      `My name is ${name.value.trim()}.\n` +
      `I would like to: ${interest.value}.\n` +
      (msg.value.trim() ? `Message: ${msg.value.trim()}\n` : '') +
      `My phone number: ${phone.value.trim()}\n\nThank you.`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');

    status.textContent = 'Your message is ready in WhatsApp. If nothing opened, ';
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'tap here to open it.';
    status.appendChild(a);
  });

  [$('#f-name'), $('#f-phone')].forEach(f => f.addEventListener('input', () => setErr(f, '')));

  /* ---------- Call and response ---------- */
  const chantBtn = $('#chant-btn');
  const chantBig = $('#chant-title');
  const chantCount = $('#chant-count');
  const lines = [
    'Once. Louder, please!',
    'Twice. One more time!',
    'Three times! Thank you, and God bless you all.'
  ];
  let chants = 0;
  chantBtn.addEventListener('click', () => {
    chantCount.textContent = lines[chants];
    chantBig.classList.remove('pulse');
    void chantBig.offsetWidth;
    chantBig.classList.add('pulse');
    chants = (chants + 1) % lines.length;
    chantBtn.textContent = chants === 0 ? 'Say it again' : 'Say it with us';
  });
})();
