/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://wknd.site/us/en.html (.carousel.panelcontainer.cmp-carousel--hero)
 * Generated: 2026-09-08
 *
 * Block library structure: 2 columns, one row per slide.
 *   Cell 1: slide image (mandatory)
 *   Cell 2: text content (title heading, description, CTA link)
 * Matches carousel-hero.js decorate(): each row's first div => slide-image, second => slide-content.
 */
export default function parse(element, { document }) {
  // Each carousel item is a slide; extract the teaser inside it.
  const items = element.querySelectorAll('.cmp-carousel__item, .cmp-teaser--hero');
  // De-duplicate: prefer the item wrapper, but if none, fall back to teasers directly.
  const slideEls = element.querySelectorAll('.cmp-carousel__item').length
    ? element.querySelectorAll('.cmp-carousel__item')
    : element.querySelectorAll('.cmp-teaser--hero');

  const cells = [];

  slideEls.forEach((slide) => {
    const teaser = slide.querySelector('.cmp-teaser') || slide;

    const image = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');
    const heading = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
    const description = teaser.querySelector('.cmp-teaser__description, p');
    const cta = teaser.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a, a');

    // Skip empty slides (no image and no text)
    if (!image && !heading && !description) return;

    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);

    cells.push([image || '', contentCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
