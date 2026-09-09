/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns. Base: columns.
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--featured)
 * Generated: 2026-09-08
 *
 * Block library structure: multiple columns, first row is block name.
 * columns.js decorate() treats each direct child of the second row as a column.
 * Featured-article teaser => 2 columns: [text content, image].
 */
export default function parse(element, { document }) {
  const teaser = element.querySelector('.cmp-teaser') || element;

  const pretitle = teaser.querySelector('.cmp-teaser__pretitle');
  const heading = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = teaser.querySelector('.cmp-teaser__description, p:not(.cmp-teaser__pretitle)');
  const cta = teaser.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a, a');
  const image = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  // Text column content
  const textCell = [];
  if (pretitle) textCell.push(pretitle);
  if (heading) textCell.push(heading);
  if (description) textCell.push(description);
  if (cta) textCell.push(cta);

  if (!textCell.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // One row, two columns: text content and image side-by-side.
  const cells = [[textCell, image || '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
