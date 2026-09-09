/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards. Base: cards.
 * Sources:
 *   - Homepage:    https://wknd.site/us/en.html  (.image-list.list)
 *   - Landing page: contributor experience fragments
 *                  (section.experiencefragment.cmp-experience-fragment--contributor)
 * Generated: 2026-09-08
 *
 * Block library structure: 2 columns, one row per card.
 *   Cell 1: image (mandatory)
 *   Cell 2: text content (title heading, description/role, optional CTA / social links)
 * Matches cards.js decorate(): a column containing only a picture => card-image,
 * the other column => card-body.
 *
 * The same block name "cards" is authored by two different source structures.
 * The parser detects which structure `element` is and dispatches accordingly:
 *   1. Homepage image-list  -> element is the .image-list.list; rows are its items.
 *   2. Landing-page XF card -> element is ONE section.cmp-experience-fragment--contributor.
 *      The import script invokes the parser once per XF section (e.g. 7 times), but a
 *      cards block should contain all sibling contributor cards. So on the FIRST sibling
 *      we build a multi-row block from the whole group and remove the other siblings; on
 *      subsequent siblings we simply remove them (the block already exists) to avoid
 *      emitting duplicate 1-card blocks.
 */

const CONTRIBUTOR_SELECTOR = 'section.cmp-experience-fragment--contributor';

/**
 * Build one card row [imageCell, bodyCell] from a single contributor XF section.
 * Returns null when the section has no usable content.
 */
function buildContributorRow(section, document) {
  const image = section.querySelector(
    'div.image .cmp-image__image, div.image img, .cmp-image img, img',
  );
  // Name is rendered as an h3, role as an h5 (both .cmp-title__text).
  const nameEl = section.querySelector('h3.cmp-title__text, .cmp-title h3, h3');
  const roleEl = section.querySelector('h5.cmp-title__text, .cmp-title h5, h5');
  const socialLinks = Array.from(section.querySelectorAll('a.cmp-button, .cmp-button a'));

  if (!image && !nameEl && !roleEl && !socialLinks.length) return null;

  const bodyCell = [];

  if (nameEl && nameEl.textContent.trim()) {
    const h3 = document.createElement('h3');
    h3.textContent = nameEl.textContent.trim();
    bodyCell.push(h3);
  }

  if (roleEl && roleEl.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = roleEl.textContent.trim();
    bodyCell.push(p);
  }

  socialLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const label = (link.querySelector('.cmp-button__text') || link).textContent.trim();
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = label || href;
    p.append(a);
    bodyCell.push(p);
  });

  return [image || '', bodyCell];
}

/**
 * Landing-page branch: element is a single contributor XF section. Build one cards block
 * from the whole sibling group, once, on the first sibling; remove the rest.
 */
function parseContributorCards(element, document) {
  const parent = element.parentElement;

  // Collect all contributor sections within the same parent grid. Prefer direct children
  // (so distinct grids -> distinct blocks), with fallbacks for DOM variation.
  let group = parent
    ? Array.from(parent.querySelectorAll(`:scope > ${CONTRIBUTOR_SELECTOR}`))
    : [];
  if (!group.includes(element)) {
    group = parent ? Array.from(parent.querySelectorAll(CONTRIBUTOR_SELECTOR)) : [];
  }
  if (!group.includes(element)) group = [element];

  // Guard: build the block only once per group, from the first sibling. For any later
  // sibling the block already exists, so just remove this element without emitting one.
  if (group[0] !== element) {
    element.remove();
    return;
  }

  const cells = [];
  group.forEach((section) => {
    const row = buildContributorRow(section, document);
    if (row) cells.push(row);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  // Replace the first sibling with the block, then drop the remaining folded-in siblings.
  element.replaceWith(block);
  group.slice(1).forEach((section) => section.remove());
}

/**
 * Homepage branch: element is the .image-list.list; each item becomes a card row.
 */
function parseImageList(element, document) {
  const items = element.querySelectorAll('.cmp-image-list__item, li');

  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');
    const titleEl = item.querySelector('.cmp-image-list__item-title');
    const titleLink = item.querySelector('.cmp-image-list__item-title-link');
    const description = item.querySelector('.cmp-image-list__item-description');

    if (!image && !titleEl && !description) return;

    // Build the title as a heading, preserving the link when present.
    let heading = '';
    const titleText = titleEl ? titleEl.textContent.trim() : '';
    if (titleText) {
      heading = document.createElement('h3');
      const href = titleLink ? titleLink.getAttribute('href') : null;
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = titleText;
        heading.append(a);
      } else {
        heading.textContent = titleText;
      }
    }

    const bodyCell = [];
    if (heading) bodyCell.push(heading);
    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      bodyCell.push(p);
    }

    cells.push([image || '', bodyCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}

export default function parse(element, { document }) {
  // Detect landing-page contributor experience-fragment cards.
  const isContributor = element.matches
    ? element.matches(CONTRIBUTOR_SELECTOR)
    : element.classList && element.classList.contains('cmp-experience-fragment--contributor');

  if (isContributor) {
    parseContributorCards(element, document);
    return;
  }

  // Default: homepage image-list structure.
  parseImageList(element, document);
}
