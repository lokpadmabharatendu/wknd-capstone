// Accordion (FAQ) block.
// Each block child row = one item: cell 1 = question (summary), cell 2 = answer (panel).
// Decorates each row into a <details>/<summary> element that toggles open/closed on click.
// NOTE: vendored scripts/aem.js does not export fetchPlaceholders; use an inline
// placeholders object with ||-fallbacks instead of importing it.
const placeholders = {};

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // label + body
    const label = row.children[0];
    const body = row.children[1];

    // decorate accordion item label
    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    summary.append(...(label ? label.childNodes : []));
    const labelWrapper = document.createElement('div');
    labelWrapper.append(...summary.childNodes);
    summary.append(labelWrapper);

    // decorate accordion item body
    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    const content = document.createElement('div');
    content.className = 'accordion-faq-item-body';
    if (body) content.append(...body.childNodes);

    details.append(summary, content);
    row.replaceWith(details);
  });

  // ensure a stable label for assistive tech / future use
  block.setAttribute('aria-label', placeholders.faq || 'Frequently asked questions');
}
