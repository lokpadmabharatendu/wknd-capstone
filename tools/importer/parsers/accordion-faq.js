/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq.
 * Base block: accordion.
 * Source: https://wknd.site/us/en/faqs.html (.accordion.panelcontainer)
 * Generated: 2026-09-08
 *
 * Block library convention (accordion): 2-column table.
 *   Row 1: block name.
 *   Each subsequent row = one accordion item: [title cell, content cell].
 * Source is an AEM accordion (.cmp-accordion) with .cmp-accordion__item entries:
 *   - header text: .cmp-accordion__title (inside .cmp-accordion__header / button)
 *   - answer body: .cmp-accordion__panel content
 */
export default function parse(element, { document }) {
  // Each .cmp-accordion__item is one Q&A pair.
  const items = element.querySelectorAll('.cmp-accordion__item');

  const cells = [];

  items.forEach((item) => {
    // Question: prefer the title span, fall back to header/button text.
    const titleEl = item.querySelector(
      '.cmp-accordion__title, .cmp-accordion__header, .cmp-accordion__button',
    );
    // Answer: the panel content (preserve paragraphs, links, lists, headings).
    const panel = item.querySelector('.cmp-accordion__panel');

    // Skip items with no usable content.
    if (!titleEl && !panel) return;

    // Build the question cell as a heading so it reads as a strong summary label.
    const questionCell = document.createElement('p');
    questionCell.textContent = (titleEl ? titleEl.textContent : '').trim();

    // Build the answer cell: pull the meaningful body nodes from the panel.
    // Prefer the inner text/container content; fall back to the whole panel.
    const answerCell = [];
    if (panel) {
      // The real answer content lives inside .cmp-text (paragraphs, lists, links).
      const textBlocks = panel.querySelectorAll('.cmp-text');
      if (textBlocks.length) {
        textBlocks.forEach((tb) => {
          answerCell.push(...tb.childNodes);
        });
      } else {
        // Fallback: use the panel's own children.
        answerCell.push(...panel.childNodes);
      }
    }

    cells.push([questionCell, answerCell]);
  });

  // Empty-block guard: nothing extracted, leave content in place.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
