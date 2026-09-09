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
