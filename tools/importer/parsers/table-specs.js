/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-specs. Base: table.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.cmp-contentfragment__elements)
 * Generated: 2026-09-08
 *
 * Block library structure (table): first row = block name, each subsequent row = a data row,
 *   cells across columns hold data points / labels.
 *
 * Source DOM: a <dl class="cmp-contentfragment__elements"> of
 *   .cmp-contentfragment__element blocks, each with a .cmp-contentfragment__element-title (label)
 *   and .cmp-contentfragment__element-value (value). This maps cleanly to a 2-column
 *   label/value table (no header).
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-contentfragment__element'));

  const cells = [];

  items.forEach((item) => {
    const label = item.querySelector('.cmp-contentfragment__element-title, dt');
    const value = item.querySelector('.cmp-contentfragment__element-value, dd');

    const labelText = label ? label.textContent.trim() : '';
    const valueText = value ? value.textContent.trim() : '';

    // Skip fully empty rows.
    if (!labelText && !valueText) return;

    cells.push([labelText, valueText]);
  });

  // Empty-block guard: no spec rows means nothing to import.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-specs', cells });
  element.replaceWith(block);
}
