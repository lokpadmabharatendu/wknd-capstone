/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero. Base: hero.
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--hero.cmp-teaser--imagebottom)
 * Generated: 2026-09-08
 *
 * Block library structure: 1 column, 3 rows.
 *   Row 1: block name (added by createBlock)
 *   Row 2: single cell => background image (optional)
 *   Row 3: single cell => title heading, subheading text, CTA link (optional)
 */
/** Rewrite an absolute wknd.site URL path to a site-relative path. */
function toRelativePath(href) {
  if (!href) return '';
  try {
    // Absolute URL → pathname; already-relative stays as-is.
    const u = new URL(href, 'https://wknd.site');
    return u.pathname.replace(/\.html?$/, '');
  } catch (e) {
    return href.replace(/\.html?$/, '');
  }
}

export default function parse(element, { document }) {
  const teaser = element.querySelector('.cmp-teaser') || element;

  const image = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');
  const heading = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = teaser.querySelector('.cmp-teaser__description, p:not(.cmp-teaser__pretitle)');
  const cta = teaser.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a, a');

  if (!heading && !description && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // DYNAMIC "Next Adventures" hero: when the teaser's CTA points at an
  // adventure detail page, emit a REFERENCE block (a single path) instead of
  // static image+content. blocks/hero/hero.js fetches that page at runtime and
  // builds the hero from its first image + metadata title/description.
  const ctaHref = cta ? cta.getAttribute('href') : '';
  const refPath = toRelativePath(ctaHref);
  if (/\/adventures\/[^/]+$/.test(refPath)) {
    const link = document.createElement('a');
    link.setAttribute('href', refPath);
    link.textContent = refPath;
    const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells: [[link]] });
    element.replaceWith(block);
    return;
  }

  const cells = [];

  // Row 2: background image (single cell, one column).
  cells.push([image || '']);

  // Row 3: text content (single cell, one column).
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  if (cta) contentCell.push(cta);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
