(function () {
  // ---- Affiliate reveal flow ------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const revealParam = params.get('reveal');
  if (revealParam !== null) {
    const target = document.querySelector('.code[data-index="' + cssEsc(revealParam) + '"]');
    if (target) {
      target.classList.add('is-revealed');
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
    } else {
      document.querySelectorAll('.code').forEach((el) => el.classList.add('is-revealed'));
    }
  }

  document.querySelectorAll('.reveal-btn').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const affiliate = btn.getAttribute('data-affiliate');
      const index = btn.getAttribute('data-index');
      const url = new URL(window.location.href);
      url.search = '?reveal=' + encodeURIComponent(index);
      window.open(url.toString(), '_blank', 'noopener');
      if (affiliate) {
        window.location.href = affiliate;
      }
    });
  });

  // ---- Copy-to-clipboard ----------------------------------------------------
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.code-value');
      const code = wrap && wrap.getAttribute('data-code');
      if (!code) return;
      const copiedLabel = btn.getAttribute('data-copied') || 'Copied!';
      const done = () => {
        const orig = btn.textContent;
        btn.textContent = copiedLabel;
        setTimeout(() => { btn.textContent = orig; }, 1400);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code).then(done).catch(fallback);
      } else {
        fallback();
      }
      function fallback() {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
  });

  // ---- Shop filter (all-shops page) ----------------------------------------
  const filter = document.getElementById('shop-filter');
  if (filter) {
    const cards = Array.from(document.querySelectorAll('.letter-block .shop-card'));
    const blocks = Array.from(document.querySelectorAll('.letter-block'));
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      cards.forEach((c) => {
        const name = (c.querySelector('h3')?.textContent || '').toLowerCase();
        c.style.display = !q || name.includes(q) ? '' : 'none';
      });
      blocks.forEach((b) => {
        const visible = b.querySelectorAll('.shop-card:not([style*="display: none"])').length;
        b.style.display = visible === 0 ? 'none' : '';
      });
    });
  }

  function cssEsc(s) {
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }
})();
