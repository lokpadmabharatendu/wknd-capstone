/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-detail. Base: tabs.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.tabs.panelcontainer / .cmp-tabs)
 * Generated: 2026-09-08
 *
 * Block library structure (tabs): 2 columns, first row = block name, each subsequent row = one tab:
 *   [ Tab Label (mandatory), Tab Content (mandatory) ].
 *
 * Source DOM: .cmp-tabs > ol.cmp-tabs__tablist > li.cmp-tabs__tab (labels)
 *   and sibling .cmp-tabs__tabpanel elements (content, in document order matching labels).
 *   Panel content is a contentfragment article; the meaningful content lives in
 *   .cmp-contentfragment__elements (paragraphs, lists, images). Empty AEM grid wrappers are dropped.
 */
export default function parse(element, { document }) {
  const labels = Array.from(element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab, ol.cmp-tabs__tablist > li'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  const cells = [];

  labels.forEach((label, i) => {
    const panel = panels[i];
    const labelText = label ? label.textContent.trim() : '';

    // Prefer the content fragment's meaningful content; fall back to the whole panel.
    let contentRoot = panel ? panel.querySelector('.cmp-contentfragment__elements') : null;
    if (!contentRoot && panel) contentRoot = panel;

    const contentCell = [];
    if (contentRoot) {
      // Pull real content nodes (text, lists, images), skipping empty AEM grid layout wrappers.
      Array.from(contentRoot.querySelectorAll('p, ul, ol, h1, h2, h3, h4, h5, h6, img'))
        .filter((n) => {
          if (n.tagName === 'IMG') return true;
          // Keep nodes that carry text or wrap an image.
          return n.textContent.trim().length > 0 || n.querySelector('img');
        })
        .forEach((n) => contentCell.push(n));
    }

    if (!labelText && !contentCell.length) return;

    cells.push([labelText, contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: no tabs means nothing to import.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-detail', cells });
  element.replaceWith(block);
}
