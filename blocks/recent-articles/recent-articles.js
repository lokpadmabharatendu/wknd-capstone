import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

const PAGE_SIZE = 4;

/**
 * Fetch a query-index feed. Returns its `data` array (empty on any failure so
 * the block degrades gracefully when the index isn't published yet).
 * @param {string} url query-index endpoint
 * @returns {Promise<Array>} index rows
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
 * Resolve an entry's creation date as a comparable number (ms since epoch).
 * The query-index may store dates as epoch seconds/ms (numeric strings) or as
 * an ISO date string; handle both. Try the common field names, newest
 * meaningful value wins. Returns 0 when none is present/parseable.
 * @param {object} entry query-index row
 */
function entryDate(entry) {
  const raw = entry.date || entry.publishDate || entry.published
    || entry.created || entry.lastModified || 0;
  if (raw === 0 || raw === '') return 0;
  const num = Number(raw);
  if (Number.isFinite(num) && num > 0) {
    // Heuristic: 10-digit values are epoch seconds, 13-digit are ms.
    return num < 1e12 ? num * 1000 : num;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Build a single article card (image + title link + description). */
function buildCard(entry) {
  const li = document.createElement('li');

  const imageDiv = document.createElement('div');
  imageDiv.className = 'recent-articles-card-image';
  if (entry.image) {
    const pic = createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]);
    const link = document.createElement('a');
    link.href = entry.path;
    link.append(pic);
    imageDiv.append(link);
  }

  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'recent-articles-card-body';
  const title = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = entry.path;
  titleLink.textContent = entry.title || entry.path;
  title.append(titleLink);
  bodyDiv.append(title);
  if (entry.description) {
    const desc = document.createElement('p');
    desc.textContent = entry.description;
    bodyDiv.append(desc);
  }

  li.append(imageDiv, bodyDiv);
  return li;
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  // Authoring options (all optional):
  //   source  – query-index URL (default /query-index.json)
  //   filter  – only include rows whose path starts with this prefix
  //   limit   – number of cards shown (default 4)
  const source = config.source || '/query-index.json';
  const filter = config.filter || '';
  const limit = Number(config.limit) || PAGE_SIZE;

  block.textContent = '';

  let rows = await fetchIndex(source);
  if (filter) rows = rows.filter((r) => (r.path || '').startsWith(filter));
  // Newest first, by creation date.
  rows.sort((a, b) => entryDate(b) - entryDate(a));

  if (!rows.length) return;

  // Show only the latest N (default 4) — no paging.
  const list = document.createElement('ul');
  list.className = 'recent-articles-list';
  list.append(...rows.slice(0, limit).map(buildCard));
  block.append(list);
}
