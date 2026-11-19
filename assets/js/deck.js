/*
  Inline slide viewer. Markup:
    <div class="deck" data-deck>
      ...stage with .deck-frame img, .deck-nav.prev/.next, .deck-count, .deck-title
      <ol class="deck-thumbs"> <li><button data-i="0"><img src=... alt=...></button></li> ... </ol>
    </div>
  Slides come from the thumbnail images (src + alt + data-title).
  Arrow keys, swipe and thumbnails navigate; the full-screen button stays in the same tab.
*/
(function () {
  document.querySelectorAll('[data-deck]').forEach((deck) => {
    const thumbs = [...deck.querySelectorAll('.deck-thumbs button')];
    const img = deck.querySelector('.deck-frame img');
    const prev = deck.querySelector('.deck-nav.prev');
    const next = deck.querySelector('.deck-nav.next');
    const count = deck.querySelector('.deck-count');
    const title = deck.querySelector('.deck-title');
    const stage = deck.querySelector('.deck-stage');
    const fullBtn = deck.querySelector('[data-deck-full]');
    const slides = thumbs.map((b) => {
      const t = b.querySelector('img');
      return { src: t.dataset.full || t.src, alt: t.alt, title: t.dataset.title || '' };
    });
    let i = 0;

    function show(n) {
      i = Math.max(0, Math.min(slides.length - 1, n));
      img.src = slides[i].src;
      img.alt = slides[i].alt;
      if (title) title.textContent = slides[i].title;
      count.textContent = (i + 1) + ' / ' + slides.length;
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
      thumbs.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
      // Preload the neighbours so the next click is instant
      [i - 1, i + 1].forEach((k) => { if (slides[k]) { const p = new Image(); p.src = slides[k].src; } });
    }

    prev.addEventListener('click', () => show(i - 1));
    next.addEventListener('click', () => show(i + 1));
    thumbs.forEach((b, k) => b.addEventListener('click', () => show(k)));

    deck.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { show(i - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { show(i + 1); e.preventDefault(); }
    });

    // Swipe on touch screens
    let x0 = null;
    stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    if (fullBtn) {
      if (!deck.requestFullscreen) { fullBtn.hidden = true; }
      fullBtn.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else deck.requestFullscreen().then(() => stage.focus()).catch(() => {});
      });
      document.addEventListener('fullscreenchange', () => {
        fullBtn.textContent = document.fullscreenElement === deck ? 'Exit full screen' : 'Full screen';
      });
    }

    show(0);
  });
})();
