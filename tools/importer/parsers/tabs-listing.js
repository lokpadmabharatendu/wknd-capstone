/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-listing. Base: tabs.
 * Source: https://wknd.site/us/en/adventures.html  (.tabs.panelcontainer / .cmp-tabs)
 * Generated: 2026-09-08
 *
 * Block library structure (tabs): 2 columns, first row = block name, each subsequent
 * row = one tab: [ Tab Label (mandatory), Tab Content (mandatory) ].
 *
 * Source DOM: .cmp-tabs > ol.cmp-tabs__tablist > li.cmp-tabs__tab (labels: All, Climbing,
 *   Cycling, Skiing, Surfing, Travel) and sibling .cmp-tabs__tabpanel elements (content, in
 *   document order matching labels). Each panel holds a .cmp-image-list card grid whose items
 *   (.cmp-image-list__item) each carry an image, a title link, and a description — the same
 *   content model as the `cards` block.
 *
 * To make each panel render as the adventure card grid, the panel cell holds a nested
 * `cards` block (2 columns: image cell + body cell), matching blocks/cards/cards.js and the
 * existing tools/importer/parsers/cards.js homepage image-list convention.
 *
 * The "All" tab duplicates cards from the category tabs; tabs are preserved as authored
 * (no cross-tab dedupe).
 */

/**
 * Build a nested `cards` block from an image-list card grid inside a tab panel.
 * Returns the block element, or null when the panel has no cards.
 */
function buildCardsBlock(panel, document) {
  if (!panel) return null;

  const items = Array.from(
    panel.querySelectorAll('.cmp-image-list__item, li.cmp-image-list__item'),
  );
  if (!items.length) return null;

  const cardRows = [];

  items.forEach((item) => {
    // Image (mandatory for a card): pull the raw <img> so cards.js treats the cell as card-image.
    const img = item.querySelector(
      '.cmp-image-list__item-image img, .cmp-image__image, img',
    );

    // Title: prefer the anchored title link so navigation is preserved; fall back to the span.
    const titleLink = item.querySelector('.cmp-image-list__item-title-link');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    const descEl = item.querySelector('.cmp-image-list__item-description');

    const label = (titleText || titleLink);
    const labelStr = label ? label.textContent.trim() : '';

    // Skip empty items (defensive against layout-only wrappers).
    if (!img && !labelStr && !(descEl && descEl.textContent.trim())) return;

    const bodyCell = [];

    if (labelStr) {
      const h3 = document.createElement('h3');
      const href = titleLink ? titleLink.getAttribute('href') : null;
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = labelStr;
        h3.append(a);
      } else {
        h3.textContent = labelStr;
      }
      bodyCell.push(h3);
    }

    if (descEl && descEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = descEl.textContent.trim();
      bodyCell.push(p);
    }

    // cards.js expects one column holding only the picture (=> card-image), the other => card-body.
    cardRows.push([img || '', bodyCell.length ? bodyCell : '']);
  });

  if (!cardRows.length) return null;

  return WebImporter.Blocks.createBlock(document, { name: 'cards', cells: cardRows });
}

export default function parse(element, { document }) {
  const labels = Array.from(
    element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab, ol.cmp-tabs__tablist > li'),
  );
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  const cells = [];

  labels.forEach((label, i) => {
    const panel = panels[i];
    const labelText = label ? label.textContent.trim() : '';

    const cardsBlock = buildCardsBlock(panel, document);

    // Skip a tab only if it has neither a label nor any card content.
    if (!labelText && !cardsBlock) return;

    cells.push([labelText, cardsBlock || '']);
  });

  // Empty-block guard: no tabs means nothing to import.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-listing', cells });
  element.replaceWith(block);
}
