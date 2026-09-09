/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the "Members Only" secure teasers on the magazine listing page.
 * Source: https://wknd.site/us/en/magazine.html
 *   .teaser.cmp-teaser--list.cmp-teaser--secure  (two side-by-side teasers)
 *
 * Each secure teaser is content-first (title, description, "Read More") with the
 * image below. The two teasers sit side by side. We render them as ONE columns
 * block: two columns, each column stacking [heading, description, cta, image] —
 * columns.css lays the two columns out side-by-side on desktop and stacked on
 * mobile, matching the source.
 *
 * The import script calls this parser once per matched teaser. We build the
 * block once (on the first sibling) from the whole group and remove the rest.
 */

const SECURE_SELECTOR = '.teaser.cmp-teaser--list.cmp-teaser--secure';

/** Build one column's content [heading, description, cta, image] from a teaser. */
function buildColumn(teaser, document) {
  const cell = [];

  const heading = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (heading && heading.textContent.trim()) {
    const h3 = document.createElement('h3');
    h3.textContent = heading.textContent.trim();
    cell.push(h3);
  }

  const description = teaser.querySelector('.cmp-teaser__description');
  if (description && description.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = description.textContent.trim();
    cell.push(p);
  }

  // "Read More" action. Secure teasers gate the target, so the source renders a
  // disabled Read More with no href — preserve it as a link when one exists,
  // otherwise as plain text so the label still shows.
  const actionLink = teaser.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a');
  const actionContainer = teaser.querySelector('.cmp-teaser__action-container');
  const actionText = actionLink
    ? actionLink.textContent.trim()
    : (actionContainer ? actionContainer.textContent.trim() : '');
  if (actionText) {
    const p = document.createElement('p');
    const href = actionLink ? actionLink.getAttribute('href') : null;
    if (href) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = actionText;
      p.append(a);
    } else {
      p.textContent = actionText;
    }
    cell.push(p);
  }

  const image = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');
  if (image) cell.push(image);

  return cell;
}

export default function parse(element, { document }) {
  const parent = element.parentElement;

  // Collect the sibling group of secure teasers (prefer direct children).
  let group = parent
    ? Array.from(parent.querySelectorAll(`:scope > ${SECURE_SELECTOR}`))
    : [];
  if (!group.includes(element)) {
    group = parent ? Array.from(parent.querySelectorAll(SECURE_SELECTOR)) : [];
  }
  if (!group.includes(element)) group = [element];

  // Build once, on the first sibling; later siblings are folded in and removed.
  if (group[0] !== element) {
    element.remove();
    return;
  }

  const columns = group.map((teaser) => buildColumn(teaser, document)).filter((c) => c.length);
  if (!columns.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // One row, N columns (one per teaser). The "secure" variant adds a `secure`
  // class to the columns block so columns.css can render the lock badge +
  // disabled Read More styling scoped to these gated teasers only.
  const cells = [columns];
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns',
    variants: ['secure'],
    cells,
  });
  element.replaceWith(block);
  group.slice(1).forEach((teaser) => teaser.remove());
}
