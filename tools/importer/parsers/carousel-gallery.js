/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-gallery. Base: carousel.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.carousel.cmp-carousel--mini)
 * Generated: 2026-09-08
 *
 * Block library structure (carousel): 2 columns, multiple rows.
 *   Row 1: block name.
 *   Each subsequent row = one slide: [ image (mandatory), text content (optional) ].
 *
 * Source DOM: .cmp-carousel > .cmp-carousel__content > .cmp-carousel__item (one per slide),
 *   each holding .cmp-image img. These WKND galleries are image-only, so the text cell is
 *   generally empty but is emitted when caption-like content exists.
 */
export default function parse(element, { document }) {
  // Each carousel item is a slide. Fall back to any image container if item markup is absent.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll('.cmp-image, .image')).map((img) => img.closest('.cmp-carousel__item') || img);
  }

  const cells = [];

  slides.forEach((slide) => {
    const image = slide.querySelector('img');
    if (!image) return;

    // Optional caption / text content inside the slide (headings, paragraphs, links).
    const textNodes = Array.from(slide.querySelectorAll('h1, h2, h3, h4, h5, h6, p, .cmp-title__text'))
      // Exclude carousel action button labels which are not slide content.
      .filter((n) => !n.closest('.cmp-carousel__actions') && !n.closest('.cmp-carousel__action'));
    const links = Array.from(slide.querySelectorAll('a'))
      .filter((a) => !a.closest('.cmp-carousel__actions'));

    const contentCell = [...textNodes, ...links];

    cells.push([image, contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: no slides with images means nothing to import.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-gallery', cells });
  element.replaceWith(block);
}
