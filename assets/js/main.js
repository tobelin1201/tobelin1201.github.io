// Site-wide behavior: mobile nav, project filters, table-of-contents highlight, footer year.
(function () {
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', (e) => {
      if (e.target.closest('a')) { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Project filter chips: <button class="chip" data-filter="credit">, cards carry data-category="credit"
  const chips = document.querySelectorAll('.chip[data-filter]');
  const cards = document.querySelectorAll('[data-category]');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      cards.forEach((card) => {
        card.hidden = !(f === 'all' || card.dataset.category.split(' ').includes(f));
      });
    });
  });

  // Highlight the current section in a memo's table of contents
  const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map([...tocLinks].map((a) => [a.getAttribute('href').slice(1), a]));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          tocLinks.forEach((a) => a.classList.remove('active'));
          const a = byId.get(en.target.id);
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
