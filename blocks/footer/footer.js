// WKND footer: dark bar with logo + nav links + Follow Us social icons,
// then a legal band (copyright + descriptive paragraph with inline links).
// Content comes from /content/footer.plain.html; this JS reads and renders it.

/**
 * Fetch the footer fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const container = document.createElement('div');
  container.innerHTML = html;
  // Rewrite relative image paths to the footer content root so they resolve
  // regardless of page depth. /content first (localhost), then root (prod).
  const base = resp.url.includes('/content/') ? '/content/' : '/';
  container.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|\/|data:)/.test(src)) img.setAttribute('src', base + src);
  });
  return container;
}

export default async function decorate(block) {
  const frag = await fetchFooter();
  block.textContent = '';
  if (!frag) return;

  const sections = [...frag.children];
  // Expected order: [logo, nav links, social, legal]
  const [logoSec, linksSec, socialSec, legalSec] = sections;

  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // Top row: logo | nav links | social
  const top = document.createElement('div');
  top.className = 'footer-top';

  if (logoSec) {
    const brand = document.createElement('div');
    brand.className = 'footer-brand';
    const a = logoSec.querySelector('a');
    if (a) brand.append(a);
    top.append(brand);
  }

  if (linksSec) {
    const nav = document.createElement('nav');
    nav.className = 'footer-nav';
    nav.setAttribute('aria-label', 'Footer navigation');
    const ul = linksSec.querySelector('ul');
    if (ul) {
      // WKND hides "Home" from the visible desktop footer nav; shown on mobile.
      ul.querySelectorAll('li > a').forEach((a) => {
        if (a.textContent.trim().toLowerCase() === 'home') {
          a.closest('li').classList.add('footer-home-item');
        }
      });
      nav.append(ul);
    }
    top.append(nav);
  }

  if (socialSec) {
    const social = document.createElement('div');
    social.className = 'footer-social';
    const heading = socialSec.querySelector('p');
    if (heading) {
      const label = document.createElement('span');
      label.className = 'footer-social-label';
      label.textContent = heading.textContent.trim();
      social.append(label);
    }
    const ul = socialSec.querySelector('ul');
    if (ul) {
      ul.classList.add('footer-social-list');
      social.append(ul);
    }
    top.append(social);
  }

  footer.append(top);

  // Legal band: copyright + descriptive paragraphs
  if (legalSec) {
    const legal = document.createElement('div');
    legal.className = 'footer-legal';
    while (legalSec.firstElementChild) legal.append(legalSec.firstElementChild);
    footer.append(legal);
  }

  block.append(footer);
}
