(function () {
  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
  }

  // Theme toggle (initial theme is set inline in <head> to avoid a flash)
  var root = document.documentElement;
  document.querySelectorAll('.theme-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      redrawAll();
    });
  });
  var redraws = [];
  function redrawAll() { redraws.forEach(function (f) { f(); }); }
  function cssVar(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function canvasIn(host, drawFn) {
    var canvas = document.createElement('canvas');
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    var running = true, raf = 0, t0 = performance.now();
    function loop(now) { if (!running) return; drawFn(ctx, W, H, now - t0); raf = requestAnimationFrame(loop); }
    resize();
    redraws.push(function () { if (reduce || !running) drawFn(ctx, W, H, 2600); });
    if (reduce) { drawFn(ctx, W, H, 2600); }
    else {
      raf = requestAnimationFrame(loop);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) {
          var vis = e[0].isIntersecting;
          if (vis && !running) { running = true; raf = requestAnimationFrame(loop); }
          if (!vis && running) { running = false; cancelAnimationFrame(raf); }
        }).observe(host);
      }
    }
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (reduce) drawFn(ctx, W, H, 2600); }, 80); });
  }
  function ease(x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); }

  // Home hero: the Catalyst mark, alive. Rows of bars whose lengths trace a
  // chevron; the chevron's apex drifts up and down, and each row breathes.
  var art = document.getElementById('hero-art');
  if (art) {
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var jit = [];
    for (var i = 0; i < 60; i++) jit.push({ a: 0.02 + rnd() * 0.04, w: 0.5 + rnd() * 0.8, p: rnd() * Math.PI * 2 });
    canvasIn(art, function (ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      var ROWS = Math.max(9, Math.min(36, Math.round(H / 26)));
      var step = H / ROWS, thick = Math.max(4, step * 0.46), thin = Math.max(2, step * 0.2);
      var gap = Math.max(8, W * 0.03);
      var s = t / 1000;
      var bars = cssVar('--bars') || '#6586EA', barsDim = cssVar('--bars-dim') || 'rgba(101,134,234,.45)';
      var apex = 0.5 + 0.28 * Math.sin(s * 0.45);           // where the chevron peaks (0..1)
      var breathe = 0.86 + 0.1 * Math.sin(s * 0.7);          // overall length
      for (var i = 0; i < ROWS; i++) {
        var u = (i + 0.5) / ROWS;
        var d = Math.abs(u - apex) / Math.max(apex, 1 - apex); // 0 at apex, 1 at far edge
        var len = (0.3 + 0.7 * (1 - ease(Math.min(1, d)))) * breathe;
        var j = jit[i % jit.length];
        len += j.a * Math.sin(s * j.w + j.p);
        var split = Math.min(0.95, Math.max(0.14, len)) * W;
        var y = i * step + (step - thick) / 2;
        ctx.fillStyle = bars;
        ctx.globalAlpha = 1;
        roundRect(ctx, -thick, y, split + thick, thick, thick / 2);
        var x2 = split + gap;
        if (x2 < W) { ctx.fillStyle = barsDim; roundRect(ctx, x2, y + (thick - thin) / 2, W - x2, thin, thin / 2); }
      }
      ctx.globalAlpha = 1;
    });
  }
  function roundRect(ctx, x, y, w, h, r) {
    if (w <= 0) return;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath(); ctx.fill();
  }

  // NaaS hero bars: the "lines" motif. Every row is one thick bar to a moving
  // split point, a gap, then a thinner lighter bar to the right edge.
  var host = document.getElementById('hero-bars');
  if (host) {
    var MAX = 40, rows = [], sd = 11;
    function rnd2() { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; }
    for (var k = 0; k < MAX; k++) rows.push({ a1: 0.04 + rnd2() * 0.07, w1: 0.35 + rnd2() * 0.45, p1: rnd2() * Math.PI * 2, a2: 0.02 + rnd2() * 0.04, w2: 0.9 + rnd2() * 0.9, p2: rnd2() * Math.PI * 2 });
    canvasIn(host, function (ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      var ROWS = Math.max(12, Math.min(MAX, Math.round(H / 22)));
      var step = H / ROWS, thick = Math.max(3, step * 0.34), thin = Math.max(2, step * 0.18);
      var gap = Math.max(8, W * 0.022);
      var cycle = (t / 9000) % 1;
      var base = 0.28 + 0.62 * ease(cycle < 0.5 ? cycle * 2 : 2 - cycle * 2);
      var s = t / 1000;
      var bars = cssVar('--bars') || '#6586EA', barsDim = cssVar('--bars-dim') || 'rgba(101,134,234,.5)';
      for (var i = 0; i < ROWS; i++) {
        var r = rows[i];
        var j = r.a1 * Math.sin(s * r.w1 + r.p1) + r.a2 * Math.sin(s * r.w2 + r.p2);
        var split = Math.min(0.96, Math.max(0.12, base + j)) * W;
        var y = i * step + (step - thick) / 2;
        ctx.globalAlpha = 1; ctx.fillStyle = bars;
        ctx.fillRect(0, y, split, thick);
        var x2 = split + gap;
        if (x2 < W) { ctx.fillStyle = barsDim; ctx.fillRect(x2, y + (thick - thin) / 2, W - x2, thin); }
      }
      ctx.globalAlpha = 1;
    });
  }

  // Only one FAQ item open at a time
  var items = document.querySelectorAll('.faq details');
  items.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
})();
