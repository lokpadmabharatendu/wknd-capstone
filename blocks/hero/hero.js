import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Dynamic "Next Adventures" hero.
 *
 * When the block is authored as a single reference to an adventure page (a lone
 * link or a bare path), fetch that page's `.plain.html` and build the hero from
 * it: the FIRST image on the page, the page's metadata Title, its metadata
 * Description, and a "See Trip" CTA linking to the adventure.
 *
 * When the block already holds authored image + content rows (the classic
 * static hero), leave it untouched so EDS auto-decoration renders it and the
 * existing hero.css styling applies. Any fetch failure also falls back to
 * whatever markup is present, so the page never breaks.
 */

/** Resolve the referenced adventure path from the block, or '' if none. */
function getReferencePath(block) {
  const link = block.querySelector('a[href]');
  if (link) {
    // A reference hero has a link but no image content of its own.
    if (block.querySelector('picture, img')) return '';
    return link.getAttribute('href') || '';
  }
  // Bare path text (e.g. "/us/en/adventures/climbing-new-zealand").
  const text = block.textContent.trim();
  if (/^\/[^\s]+$/.test(text) && !block.querySelector('picture, img')) return text;
  return '';
}

/** Normalize a referenced path to a `.plain.html` fetch URL. */
function toPlainUrl(path) {
  const clean = path.replace(/\.html?$/, '').replace(/\/$/, '');
  return `${clean}.plain.html`;
}

/** Look up an entry's title/description from the query index (short, curated). */
async function lookupIndex(path) {
  try {
    const resp = await fetch('/query-index.json');
    if (!resp.ok) return {};
    const json = await resp.json();
    const rows = Array.isArray(json.data) ? json.data : [];
    const target = path.replace(/\.html?$/, '').replace(/\/$/, '');
    const row = rows.find((r) => (r.path || '').replace(/\.html?$/, '').replace(/\/$/, '') === target);
    return row ? { title: row.title || '', description: row.description || '' } : {};
  } catch {
    return {};
  }
}

/**
 * Fetch and parse an adventure page. Returns { image, alt, title, description,
 * path } or null on failure.
 *
 * The image is the FIRST image on the page (per requirement). Title and
 * description come from the query index (short, curated values); the page's
 * `.plain.html` served at the site root omits the metadata block, so the index
 * is the reliable source. Falls back to the page's h1 / first body paragraph
 * when the index has no matching row.
 */
async function fetchAdventure(path) {
  try {
    const url = toPlainUrl(path);
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const html = await resp.text();
    const container = document.createElement('div');
    container.innerHTML = html;

    // Resolve relative media URLs against the adventure path (fragment.js pattern).
    const base = new URL(path.replace(/\.html?$/, ''), window.location);
    container.querySelectorAll('img[src^="./"], img[src^="media_"]').forEach((img) => {
      img.setAttribute('src', new URL(img.getAttribute('src'), base).href);
    });

    // First image on the page.
    const firstImg = container.querySelector('picture img, img');

    // Title + description from the query index (curated short values).
    const idx = await lookupIndex(path);
    let title = idx.title || '';
    let description = idx.description || '';
    if (!title) {
      const h1 = container.querySelector('h1');
      if (h1) title = h1.textContent.trim();
    }
    if (!description) {
      const p = [...container.querySelectorAll('p')]
        .find((el) => el.textContent.trim().length > 40 && !el.querySelector('picture, img'));
      if (p) description = p.textContent.trim();
    }

    return {
      image: firstImg ? firstImg.getAttribute('src') : '',
      alt: firstImg ? (firstImg.getAttribute('alt') || '') : '',
      title,
      description,
      path,
    };
  } catch {
    return null;
  }
}

/** Build the hero DOM (row1 full-bleed image, row2 white content box). */
function renderHero(block, data) {
  const imageRow = document.createElement('div');
  const imageCell = document.createElement('div');
  if (data.image) {
    imageCell.append(createOptimizedPicture(data.image, data.alt || data.title, false, [{ width: '1600' }]));
  }
  imageRow.append(imageCell);

  const contentRow = document.createElement('div');
  const contentCell = document.createElement('div');
  if (data.title) {
    const h2 = document.createElement('h2');
    h2.textContent = data.title;
    contentCell.append(h2);
  }
  if (data.description) {
    const p = document.createElement('p');
    p.textContent = data.description;
    contentCell.append(p);
  }
  const ctaP = document.createElement('p');
  const a = document.createElement('a');
  a.href = data.path;
  a.textContent = 'See Trip';
  ctaP.append(a);
  contentCell.append(ctaP);
  contentRow.append(contentCell);

  block.replaceChildren(imageRow, contentRow);
}

export default async function decorate(block) {
  const path = getReferencePath(block);
  // No adventure reference → static authored hero; leave markup for EDS/CSS.
  if (!path) return;

  const data = await fetchAdventure(path);
  // Fetch failed → leave existing markup rather than emptying the hero.
  if (!data || (!data.image && !data.title)) return;

  renderHero(block, data);
}
