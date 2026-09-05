(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const tools = document.createElement('div');
  tools.className = 'page-tools';
  tools.setAttribute('role', 'group');
  tools.setAttribute('aria-label', 'Page tools');
  const theme = document.createElement('button');
  theme.type = 'button';
  function setTheme(dark) {
    root.dataset.theme = dark ? 'dark' : 'light';
    theme.textContent = dark ? '☀' : '☾';
    theme.setAttribute('aria-label', 'Dark mode');
    theme.setAttribute('aria-pressed', String(dark));
    theme.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  }
  let saved;
  try { saved = localStorage.getItem('homepage-theme'); } catch (_) { /* Storage can be disabled. */ }
  setTheme(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  theme.addEventListener('click', () => {
    setTheme(root.dataset.theme !== 'dark');
    try { localStorage.setItem('homepage-theme', root.dataset.theme); } catch (_) { /* Optional preference. */ }
  });
  const top = document.createElement('button');
  top.type = 'button';
  top.textContent = '↑';
  top.title = 'Back to top';
  top.setAttribute('aria-label', 'Back to top');
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' }));
  tools.append(theme, top);
  document.body.append(tools);

  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  const links = [...document.querySelectorAll('#site-nav a')];
  const sections = links.map(link => {
    const url = new URL(link.href, location.href);
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname) return null;
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch (_) { return null; }
    const section = document.getElementById(id);
    if (!section) return null;
    link.target = '_self';
    return { link, section };
  }).filter(Boolean);
  let pending = false;
  function updateScroll() {
    const available = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${available > 0 ? Math.min(1, Math.max(0, scrollY / available)) : 0})`;
    let active = sections[0]?.section;
    for (const { section } of sections) {
      if (section.getBoundingClientRect().top <= 150) active = section;
    }
    for (const { link, section } of sections) {
      if (section === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    pending = false;
  }
  function scheduleScroll() {
    if (!pending) { pending = true; requestAnimationFrame(updateScroll); }
  }
  addEventListener('scroll', scheduleScroll, { passive: true });
  addEventListener('resize', scheduleScroll);
  addEventListener('load', scheduleScroll);
  updateScroll();

  // Native dialog provides Escape handling, focus trapping, and modal semantics.
  if (typeof HTMLDialogElement === 'undefined') return;
  const dialog = document.createElement('dialog');
  dialog.className = 'figure-dialog';
  dialog.setAttribute('aria-label', 'Research figure preview');
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close ×';
  const figure = document.createElement('img');
  const caption = document.createElement('p');
  dialog.append(close, figure, caption);
  document.body.append(dialog);
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.querySelectorAll('.paper-box-image img').forEach(img => {
    const title = img.closest('.paper-box').querySelector('.paper-box-text p')?.textContent.trim() || 'Research figure';
    img.alt = title;
    if (img.closest('a, button')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'figure-preview';
    button.setAttribute('aria-label', `Enlarge figure: ${title}`);
    button.title = 'Click to enlarge';
    img.replaceWith(button);
    button.append(img);
    button.addEventListener('click', () => {
      figure.src = img.currentSrc || img.src;
      figure.alt = title;
      caption.textContent = title;
      dialog.showModal();
    });
  });
})();
