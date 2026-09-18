// eslint-disable-next-line import/no-unresolved
import { toClassName, createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

/**
 * Fetch a query-index feed. Returns its `data` array (empty on any failure so
 * the block degrades gracefully when the index isn't published yet).
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
 * Resolve an entry's date as ms since epoch. Handles epoch seconds/ms (numeric
 * strings) and ISO strings; 0 when absent/unparseable.
 */
function entryDate(entry) {
  const raw = entry.date || entry.publishDate || entry.published
    || entry.created || entry.lastModified || 0;
  if (raw === 0 || raw === '') return 0;
  const num = Number(raw);
  if (Number.isFinite(num) && num > 0) return num < 1e12 ? num * 1000 : num;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Normalize a path for comparison (drop .html + trailing slash). */
function normalizePath(p) {
  return (p || '').replace(/\.html?$/, '').replace(/\/$/, '');
}

/** Build one adventure card row [imageCell, bodyCell] matching the static markup. */
function buildCard(entry) {
  const row = document.createElement('tr');

  const imageCell = document.createElement('td');
  if (entry.image) {
    const pic = createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]);
    imageCell.append(pic);
  }

  const bodyCell = document.createElement('td');
  const h3 = document.createElement('h3');
  const a = document.createElement('a');
  a.href = entry.path;
  a.textContent = entry.title || entry.path;
  h3.append(a);
  bodyCell.append(h3);
  if (entry.description) {
    const p = document.createElement('p');
    p.textContent = entry.description;
    bodyCell.append(p);
  }

  row.append(imageCell, bodyCell);
  return row;
}

/** Build a card-grid table (thead "Cards" hidden by CSS + tbody of card rows). */
function buildCardTable(entries) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th colspan="2">Cards</th></tr>';
  const tbody = document.createElement('tbody');
  entries.forEach((e) => tbody.append(buildCard(e)));
  table.append(thead, tbody);
  return table;
}

/**
 * Build the tabs+panels DOM (one child row per tab: [labelCell, contentCell]).
 * Mirrors the authored static structure so decorateTabs() works unchanged.
 */
function buildTabRow(label, contentEl) {
  const row = document.createElement('div');
  const labelDiv = document.createElement('div');
  labelDiv.textContent = label;
  const contentDiv = document.createElement('div');
  if (contentEl) contentDiv.append(contentEl);
  row.append(labelDiv, contentDiv);
  return row;
}

/**
 * Dynamic mode: read the query-index, group adventures by `activity`, and build
 * an "All" tab plus one tab per distinct activity (alphabetical). Adventures are
 * sorted newest-first by lastModified within each tab. Returns false when there
 * is nothing to render (caller keeps the static/fallback content).
 */
async function buildDynamicTabs(block, config) {
  const source = config.source || '/query-index.json';
  const filter = config.filter || '';
  const allLabel = config.all || 'All';

  let rows = await fetchIndex(source);
  if (filter) rows = rows.filter((r) => (r.path || '').startsWith(filter));
  // Exclude the listing page itself and any non-detail rows (e.g. the index).
  const listing = normalizePath(filter.replace(/\/$/, ''));
  rows = rows.filter((r) => {
    const np = normalizePath(r.path);
    return np !== listing && np.startsWith(listing ? `${listing}/` : '');
  });

  if (!rows.length) return false;

  rows.sort((a, b) => entryDate(b) - entryDate(a));

  // Distinct activities (skip blanks), alphabetical.
  const activities = [...new Set(
    rows.map((r) => (r.activity || '').trim()).filter(Boolean),
  )].sort((a, b) => a.localeCompare(b));

  block.textContent = '';

  // "All" tab first.
  block.append(buildTabRow(allLabel, buildCardTable(rows)));

  // One tab per activity.
  activities.forEach((activity) => {
    const subset = rows.filter((r) => (r.activity || '').trim() === activity);
    block.append(buildTabRow(activity, buildCardTable(subset)));
  });

  return true;
}

/**
 * Decorate the authored/generated tab rows into a tablist + panels. Each block
 * child row is one tab: the row's first cell is the tab label; the rest is the
 * panel (a card grid).
 */
function decorateTabs(block) {
  const tablist = document.createElement('div');
  tablist.className = 'tabs-listing-list';
  tablist.setAttribute('role', 'tablist');

  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    if (!tab) return;
    const id = toClassName(tab.textContent);

    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-listing-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    const button = document.createElement('button');
    button.className = 'tabs-listing-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tab.innerHTML;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
  });

  block.prepend(tablist);
}

export default async function decorate(block) {
  // Dynamic mode when the block was authored as a config table with a `filter`
  // row (the adventures listing). Otherwise fall back to the static authored
  // tab tables (backward compatible with non-re-imported locales / offline).
  const config = readBlockConfig(block);
  if (config.filter || config.source) {
    const built = await buildDynamicTabs(block, config);
    if (!built) {
      // Index unreachable / empty — leave the block empty rather than erroring.
      block.textContent = '';
      return;
    }
  }

  decorateTabs(block);
}
