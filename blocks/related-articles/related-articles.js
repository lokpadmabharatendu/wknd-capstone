import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULT_LIMIT = 4;

/**
 * Fetch a query-index feed. Returns its `data` array (empty on any failure so
 * the block degrades gracefully when the index isn't published yet).
 * @param {string} url query-index endpoint
 */
async function fetchIndex(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const json = await resp.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

/**
 * Resolve an entry's date as ms since epoch. The query-index stores dates as
 * epoch seconds/ms (numeric strings) or an ISO string; handle both. Returns 0
 * when none is present/parseable.
 * @param {object} entry query-index row
 */
function entryDateMs(entry) {
  const raw = entry.date || entry.publishDate || entry.published
    || entry.created || entry.lastModified || 0;
  if (raw === 0 || raw === '') return 0;
  const num = Number(raw);
  if (Number.isFinite(num) && num > 0) return num < 1e12 ? num * 1000 : num;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format a date like the source: "Thursday, 9 Jul 2020". Empty when no date. */
function formatDate(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Normalize a path for comparison (drop .html + trailing slash). */
function normalizePath(p) {
  return (p || '').replace(/\.html?$/, '').replace(/\/$/, '');
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  // Authoring options (all optional):
  //   source  – query-index URL (default /query-index.json)
  //   filter  – only include rows whose path starts with this prefix
  //   title   – heading text (default "Share this Story")
  //   limit   – max related items (default 4)
  const source = config.source || '/query-index.json';
  const filter = config.filter || '';
  const headingText = config.title || 'Share this Story';
  const limit = Number(config.limit) || DEFAULT_LIMIT;

  block.textContent = '';

  let rows = await fetchIndex(source);
  if (filter) rows = rows.filter((r) => (r.path || '').startsWith(filter));

  // Exclude the current article.
  const here = normalizePath(window.location.pathname);
  rows = rows.filter((r) => normalizePath(r.path) !== here);

  // Newest first.
  rows.sort((a, b) => entryDateMs(b) - entryDateMs(a));
  rows = rows.slice(0, limit);

  if (!rows.length) return;

  const heading = document.createElement('h5');
  heading.className = 'related-articles-heading';
  heading.textContent = headingText;

  const list = document.createElement('ul');
  list.className = 'related-articles-list';

  rows.forEach((entry) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = entry.path;

    const title = document.createElement('span');
    title.className = 'related-articles-item-title';
    title.textContent = entry.title || entry.path;
    link.append(title);

    const dateText = formatDate(entryDateMs(entry));
    if (dateText) {
      const date = document.createElement('span');
      date.className = 'related-articles-item-date';
      date.textContent = dateText;
      link.append(date);
    }

    li.append(link);
    list.append(li);
  });

  block.append(heading, list);

  // Desktop: float the block into the right gutter, top-aligned with the
  // article title section (the section holding the H1). The block lives in its
  // own EDS section below the article, so we anchor its section absolutely to
  // <main> and set `top` to the title section's offset — robust to the
  // variable lead-image height. Falls back to the stacked mobile layout.
  const section = block.closest('.section');
  const main = block.closest('main');
  const desktop = window.matchMedia('(min-width: 900px)');

  const position = () => {
    if (!section || !main) return;
    if (desktop.matches) {
      const titleSection = [...main.querySelectorAll(':scope > .section')]
        .find((s) => s.querySelector('h1'));
      const anchor = titleSection || section.previousElementSibling;
      main.style.position = 'relative';
      section.style.top = anchor ? `${anchor.offsetTop}px` : '';
    } else {
      section.style.top = '';
      main.style.position = '';
    }
  };

  position();
  window.addEventListener('resize', position, { passive: true });
  // Re-align once images/fonts settle and shift the layout.
  window.addEventListener('load', position, { once: true });
}
