/* eslint-disable */
/* global WebImporter */
/**
 * Parser for recent-articles. Base: recent-articles.
 * Source: Homepage "Recent Articles" image-list (.title.cmp-title--underline + .image-list.list).
 *
 * Unlike the static `cards` block, recent-articles is a DYNAMIC block: it reads
 * the query-index at runtime and renders the newest magazine articles itself.
 * So the parser does NOT enumerate the source cards — it emits a small config
 * block instead:
 *
 *   | Recent Articles          |
 *   | filter | /{locale}/magazine/ |
 *
 * The `filter` row scopes the list to the current locale's magazine section.
 * The block sorts newest-first (by `date`, falling back to `lastModified`) and
 * pages 4 cards at a time (blocks/recent-articles/recent-articles.js).
 *
 * The homepage template also has a SECOND image-list ("Where do you want to
 * go?" adventures grid) — that one is handled by the `cards` parser. This
 * parser's selector (adjacent to the underline title) matches only the Recent
 * Articles grid, but we still guard defensively in case selectors drift.
 */

/**
 * Derive the locale prefix (e.g. "/us/en") from the source URL path.
 * Homepage paths look like /us/en.html → locale "/us/en".
 */
function localeFromUrl(params) {
  const src = (params && (params.originalURL || params.url)) || '';
  try {
    const path = new URL(src).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    // First two path segments are the locale (country/language).
    const segs = path.split('/').filter(Boolean);
    if (segs.length >= 2) return `/${segs[0]}/${segs[1]}`;
    if (segs.length === 1) return `/${segs[0]}`;
  } catch (e) {
    /* fall through */
  }
  return '';
}

export default function parse(element, { document, params }) {
  // Guard: only convert the Recent Articles instance. Its section is preceded
  // by an underline title; the adventures image-list is not. If this instance
  // is not the Recent Articles one, leave it untouched for the cards parser.
  const prev = element.previousElementSibling;
  const isRecentArticles = prev
    && prev.classList
    && prev.classList.contains('cmp-title--underline');
  if (!isRecentArticles) return;

  const locale = localeFromUrl(params);
  const cells = {};
  if (locale) cells.filter = `${locale}/magazine/`;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'recent-articles',
    cells,
  });
  element.replaceWith(block);
}
