/*
  Tiny dependency-free SVG charts for project pages.

  Usage (in a page):
    <div class="chart-card">
      <h4>Title</h4><p class="chart-sub">Subtitle / units</p>
      <div class="chart" id="my-chart"></div>
    </div>
    <script>
      Charts.bar('#my-chart', {
        categories: ['FY22', 'FY23', 'FY24'],
        series: [{ name: 'Revenue', values: [158, 176, 185], color: 'var(--series-1)' }],
        format: (v) => '$' + v.toFixed(1) + 'B',
      });
    </script>

  Options (bar + line):
    categories  x-axis labels
    series      [{ name, values, color }]  (null value = no data)
    format      value -> string for tooltips / labels / table
    tickFormat  value -> string for y-axis ticks (defaults to format)
    height      px (default 280)
    valueLabels bar only: print value on each bar cap (use for <= ~6 bars)
    endLabels   line only: print value at the last point (default true)
    refLine     { value, label } optional horizontal reference line
    table       true (default) adds a collapsible data table under the chart
*/
(function (global) {
  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function niceStep(range, count) {
    const raw = range / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
    return step * mag;
  }

  function scaleY(values, refValue) {
    const vals = values.filter((v) => v != null && isFinite(v));
    if (refValue != null) vals.push(refValue);
    let min = Math.min(0, ...vals);
    let max = Math.max(0, ...vals);
    if (min === max) max = min + 1;
    const step = niceStep(max - min, 5);
    min = Math.floor(min / step) * step;
    max = Math.ceil(max / step) * step;
    const ticks = [];
    for (let t = min; t <= max + step / 2; t += step) ticks.push(+t.toFixed(10));
    return { min, max, ticks };
  }

  function setup(target, opts) {
    const root = typeof target === 'string' ? document.querySelector(target) : target;
    if (!root) return null;
    const card = root.closest('.chart-card') || root.parentElement;
    const fmt = opts.format || ((v) => String(v));

    // Legend (>= 2 series)
    if (opts.series.length > 1 && !card.querySelector('.legend')) {
      const ul = document.createElement('ul');
      ul.className = 'legend';
      opts.series.forEach((s) => {
        const li = document.createElement('li');
        const sw = document.createElement('span');
        sw.className = opts.kind === 'line' ? 'ln' : 'sw';
        sw.style.background = s.color;
        li.appendChild(sw);
        li.appendChild(document.createTextNode(s.name));
        ul.appendChild(li);
      });
      card.insertBefore(ul, root);
    }

    // Data table view
    if (opts.table !== false && !card.querySelector('.chart-table')) {
      const det = document.createElement('details');
      det.className = 'chart-table';
      const sum = document.createElement('summary');
      sum.textContent = 'View data table';
      det.appendChild(sum);
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      const t = document.createElement('table');
      const thead = t.createTHead().insertRow();
      const th0 = document.createElement('th'); th0.textContent = 'Series'; thead.appendChild(th0);
      opts.categories.forEach((c) => { const th = document.createElement('th'); th.textContent = c; thead.appendChild(th); });
      const tb = t.createTBody();
      opts.series.forEach((s) => {
        const r = tb.insertRow();
        r.insertCell().textContent = s.name;
        s.values.forEach((v) => { r.insertCell().textContent = v == null ? '—' : fmt(v); });
      });
      wrap.appendChild(t);
      det.appendChild(wrap);
      card.appendChild(det);
    }

    // Tooltip
    let tip = root.querySelector('.tooltip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; tip.setAttribute('role', 'status'); root.appendChild(tip); }

    return { root, tip, fmt };
  }

  function showTip(ctx, x, y, title, rows) {
    const { tip, root } = ctx;
    tip.replaceChildren();
    const h = document.createElement('div'); h.className = 'tt-title'; h.textContent = title; tip.appendChild(h);
    rows.forEach((r) => {
      const row = document.createElement('div'); row.className = 'tt-row';
      const k = document.createElement('i'); k.className = 'tt-key'; k.style.background = r.color; row.appendChild(k);
      const s = document.createElement('span'); s.textContent = r.name; row.appendChild(s);
      const b = document.createElement('b'); b.textContent = r.value; row.appendChild(b);
      tip.appendChild(row);
    });
    tip.classList.add('show');
    const w = root.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = x + 14; if (left + tw > w) left = x - tw - 14; if (left < 0) left = 0;
    let top = y - th - 10; if (top < 0) top = y + 14;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function hideTip(ctx) { ctx.tip.classList.remove('show'); }

  function frame(ctx, opts, allValues) {
    const width = Math.max(280, ctx.root.clientWidth);
    const height = opts.height || 280;
    const m = { top: 18, right: 18, bottom: 30, left: 52 };
    const pw = width - m.left - m.right, ph = height - m.top - m.bottom;
    const ys = scaleY(allValues, opts.refLine && opts.refLine.value);
    const y = (v) => m.top + ph - ((v - ys.min) / (ys.max - ys.min)) * ph;

    ctx.root.querySelector('svg')?.remove();
    const svg = el('svg', { width, height, viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': opts.label || '' });
    ctx.root.insertBefore(svg, ctx.tip);

    const g = el('g', { class: 'grid' }, svg);
    ys.ticks.forEach((t) => {
      el('line', { x1: m.left, x2: width - m.right, y1: y(t), y2: y(t) }, g);
      const tx = el('text', { x: m.left - 8, y: y(t) + 4, 'text-anchor': 'end' }, svg);
      tx.textContent = (opts.tickFormat || ctx.fmt)(t);
    });
    el('line', { class: 'zero', x1: m.left, x2: width - m.right, y1: y(0), y2: y(0) }, svg);

    if (opts.refLine) {
      const ry = y(opts.refLine.value);
      el('line', { x1: m.left, x2: width - m.right, y1: ry, y2: ry, stroke: 'var(--text-2)', 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: .6 }, svg);
      const t = el('text', { x: m.left + 6, y: ry - 6, 'text-anchor': 'start' }, svg);
      t.textContent = opts.refLine.label;
    }
    return { svg, width, height, m, pw, ph, y };
  }

  function bar(target, opts) {
    opts.kind = 'bar';
    const ctx = setup(target, opts);
    if (!ctx) return;
    const all = opts.series.flatMap((s) => s.values);

    function render() {
      const f = frame(ctx, opts, all);
      const n = opts.categories.length, k = opts.series.length;
      const band = f.pw / n;
      const gap = 2;
      const bw = Math.max(6, Math.min(24, (band * 0.72 - gap * (k - 1)) / k));
      const groupW = bw * k + gap * (k - 1);

      opts.categories.forEach((cat, i) => {
        const cx = f.m.left + band * i + band / 2;
        const lbl = el('text', { x: cx, y: f.height - 8, 'text-anchor': 'middle' }, f.svg);
        lbl.textContent = cat;

        opts.series.forEach((s, j) => {
          const v = s.values[i];
          if (v == null) return;
          const x = cx - groupW / 2 + j * (bw + gap);
          const y0 = f.y(0), y1 = f.y(v);
          const h = Math.abs(y1 - y0);
          const r = Math.min(4, h, bw / 2);
          // Rounded data-end, square at baseline
          let d;
          if (v >= 0) {
            d = `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + bw - r} Q${x + bw},${y1} ${x + bw},${y1 + r} V${y0} Z`;
          } else {
            d = `M${x},${y0} V${y1 - r} Q${x},${y1} ${x + r},${y1} H${x + bw - r} Q${x + bw},${y1} ${x + bw},${y1 - r} V${y0} Z`;
          }
          // Bigger hit target than the painted mark (drawn underneath it)
          const hit = el('rect', { x: x - 1, y: Math.min(y0, y1) - 6, width: bw + 2, height: Math.max(h, 2) + 12, fill: 'transparent' }, f.svg);
          const p = el('path', { d, fill: s.color, class: 'bar', tabindex: 0, 'aria-label': `${cat} ${s.name}: ${ctx.fmt(v)}` }, f.svg);
          const show = (ev) => {
            const rect = ctx.root.getBoundingClientRect();
            const px = ev && ev.clientX != null ? ev.clientX - rect.left : x + bw / 2;
            const py = ev && ev.clientY != null ? ev.clientY - rect.top : Math.min(y0, y1);
            showTip(ctx, px, py, cat, [{ name: s.name, value: ctx.fmt(v), color: s.color }]);
          };
          [p, hit].forEach((node) => {
            node.addEventListener('pointermove', show);
            node.addEventListener('pointerleave', () => hideTip(ctx));
          });
          p.addEventListener('focus', () => show(null));
          p.addEventListener('blur', () => hideTip(ctx));

          if (opts.valueLabels) {
            const ty = v >= 0 ? y1 - 6 : y1 + 14;
            const t = el('text', { x: x + bw / 2, y: ty, 'text-anchor': 'middle', class: 'label-strong' }, f.svg);
            t.textContent = ctx.fmt(v);
          }
        });
      });
    }
    render();
    observe(ctx.root, render);
  }

  function line(target, opts) {
    opts.kind = 'line';
    const ctx = setup(target, opts);
    if (!ctx) return;
    const all = opts.series.flatMap((s) => s.values);

    function render() {
      const f = frame(ctx, opts, all);
      const n = opts.categories.length;
      const pad = 28;
      const x = (i) => f.m.left + pad + (n === 1 ? 0 : (i * (f.pw - pad * 2)) / (n - 1));

      opts.categories.forEach((cat, i) => {
        const t = el('text', { x: x(i), y: f.height - 8, 'text-anchor': 'middle' }, f.svg);
        t.textContent = cat;
      });

      const cross = el('line', { class: 'crosshair', y1: f.m.top, y2: f.m.top + f.ph, x1: -10, x2: -10, opacity: 0 }, f.svg);

      opts.series.forEach((s) => {
        const pts = s.values.map((v, i) => (v == null ? null : [x(i), f.y(v)]));
        let d = '', pen = false;
        pts.forEach((p) => { if (!p) { pen = false; return; } d += (pen ? 'L' : 'M') + p[0] + ',' + p[1]; pen = true; });
        el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, f.svg);
        pts.forEach((p) => { if (p) el('circle', { cx: p[0], cy: p[1], r: 4, fill: s.color, stroke: 'var(--surface-1)', 'stroke-width': 2 }, f.svg); });
        if (opts.endLabels !== false) {
          let li = s.values.length - 1; while (li >= 0 && s.values[li] == null) li--;
          if (li >= 0) {
            const t = el('text', { x: pts[li][0], y: pts[li][1] - 10, 'text-anchor': 'middle', class: 'label-strong' }, f.svg);
            t.textContent = ctx.fmt(s.values[li]);
          }
        }
      });

      // Crosshair hit layer: snap to the nearest category
      const hit = el('rect', { class: 'hit', x: f.m.left, y: f.m.top, width: f.pw, height: f.ph, tabindex: 0, 'aria-label': opts.label || 'chart' }, f.svg);
      const at = (i) => {
        cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', 1);
        const rows = opts.series.map((s) => ({ name: s.name, value: s.values[i] == null ? '—' : ctx.fmt(s.values[i]), color: s.color }));
        const top = Math.min(...opts.series.map((s) => (s.values[i] == null ? f.height : f.y(s.values[i]))));
        showTip(ctx, x(i), top, opts.categories[i], rows);
      };
      let focusIdx = n - 1;
      hit.addEventListener('pointermove', (ev) => {
        const rect = f.svg.getBoundingClientRect();
        const px = ev.clientX - rect.left;
        let best = 0, bd = Infinity;
        for (let i = 0; i < n; i++) { const dd = Math.abs(x(i) - px); if (dd < bd) { bd = dd; best = i; } }
        at(best);
      });
      const hide = () => { cross.setAttribute('opacity', 0); hideTip(ctx); };
      hit.addEventListener('pointerleave', hide);
      hit.addEventListener('focus', () => at(focusIdx));
      hit.addEventListener('blur', hide);
      hit.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { focusIdx = Math.min(n - 1, focusIdx + 1); at(focusIdx); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { focusIdx = Math.max(0, focusIdx - 1); at(focusIdx); e.preventDefault(); }
      });
    }
    render();
    observe(ctx.root, render);
  }

  function observe(node, fn) {
    if (!('ResizeObserver' in window)) { window.addEventListener('resize', fn); return; }
    let w = node.clientWidth, raf;
    new ResizeObserver(() => {
      if (node.clientWidth === w) return;
      w = node.clientWidth;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(fn);
    }).observe(node);
  }

  global.Charts = { bar, line };
})(window);
