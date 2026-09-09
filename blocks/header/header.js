// WKND header: dark utility bar (Sign In + locale selector) over a white bar
// (logo + nav links + search). Content comes from /content/nav.plain.html;
// the search form and interactive controls are built here.

const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const container = document.createElement('div');
  container.innerHTML = html;
  // Fragment uses relative image paths (e.g. images/logo.svg) which would
  // resolve against the current page path. Rewrite to the nav content root so
  // they work on any page depth. Try /content first (localhost), then root.
  const base = resp.url.includes('/content/') ? '/content/' : '/';
  container.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|\/|data:)/.test(src)) {
      img.setAttribute('src', base + src);
    }
  });
  return container;
}

/** Build the search form (controls are created in JS, never in the fragment). */
function buildSearch() {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/us/en';
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'SEARCH';
  input.setAttribute('aria-label', 'Search');
  form.append(input);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) window.location.href = `/us/en?q=${encodeURIComponent(q)}`;
  });
  return form;
}

function closeLocale(localeWrap) {
  localeWrap.classList.remove('open');
  const btn = localeWrap.querySelector('.nav-locale-toggle');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

export default async function decorate(block) {
  const nav = await fetchNav();
  block.textContent = '';
  if (!nav) return;

  const sections = [...nav.children];
  // Expected order from nav.plain.html: [signin, logo, navlinks, locales]
  const [signInSec, logoSec, linksSec, localeSec] = sections;

  const header = document.createElement('div');
  header.className = 'nav-wrapper';

  // ---- Utility bar (dark) ----
  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  const utilityInner = document.createElement('div');
  utilityInner.className = 'nav-utility-inner';

  if (signInSec) {
    const signIn = document.createElement('div');
    signIn.className = 'nav-signin';
    signIn.append(...signInSec.querySelectorAll('a'));
    utilityInner.append(signIn);
  }

  // Locale selector (flag-dropdown) built from the locale list
  if (localeSec) {
    const localeWrap = document.createElement('div');
    localeWrap.className = 'nav-locale';
    const items = [...localeSec.querySelectorAll('li')];
    const current = items[0]; // en-US is first / current
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-locale-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-haspopup', 'true');
    if (current) {
      const a = current.querySelector('a');
      const img = a && a.querySelector('img');
      if (img) toggle.append(img.cloneNode(true));
      const label = document.createElement('span');
      label.textContent = (a ? a.textContent : 'en-US').trim();
      toggle.append(label);
    }
    const caret = document.createElement('span');
    caret.className = 'nav-locale-caret';
    caret.setAttribute('aria-hidden', 'true');
    toggle.append(caret);

    const menu = document.createElement('ul');
    menu.className = 'nav-locale-menu';
    items.forEach((li) => menu.append(li));

    toggle.addEventListener('click', () => {
      const open = localeWrap.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    localeWrap.append(toggle, menu);
    utilityInner.append(localeWrap);

    document.addEventListener('click', (e) => {
      if (!localeWrap.contains(e.target)) closeLocale(localeWrap);
    });
  }

  utility.append(utilityInner);

  // ---- Main bar (white): logo + nav links + search ----
  const main = document.createElement('div');
  main.className = 'nav-main';
  const mainInner = document.createElement('div');
  mainInner.className = 'nav-main-inner';

  if (logoSec) {
    const brand = document.createElement('div');
    brand.className = 'nav-brand';
    const logoLink = logoSec.querySelector('a');
    if (logoLink) brand.append(logoLink);
    mainInner.append(brand);
  }

  // hamburger (mobile)
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.type = 'button';
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';

  const tools = document.createElement('div');
  tools.className = 'nav-tools';

  if (linksSec) {
    const links = document.createElement('nav');
    links.className = 'nav-links';
    links.setAttribute('aria-label', 'Main navigation');
    const ul = linksSec.querySelector('ul');
    if (ul) {
      // WKND hides "Home" from the visible desktop nav (logo links home) and
      // shows it only on mobile — tag it so CSS can match that behavior.
      ul.querySelectorAll('li > a').forEach((a) => {
        if (a.textContent.trim().toLowerCase() === 'home') {
          a.closest('li').classList.add('nav-home-item');
        }
      });
      links.append(ul);
    }
    tools.append(links);
  }

  tools.append(buildSearch());

  // Overlay behind the mobile slide-in drawer (dismisses on click)
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  mainInner.append(hamburger, tools, overlay);

  const setOpen = (open) => {
    main.classList.toggle('nav-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };
  hamburger.addEventListener('click', () => setOpen(!main.classList.contains('nav-open')));
  overlay.addEventListener('click', () => setOpen(false));

  main.append(mainInner);
  header.append(utility, main);
  block.append(header);

  // Reset mobile menu state when resizing up to desktop
  isDesktop.addEventListener('change', () => {
    if (isDesktop.matches) setOpen(false);
  });
}
