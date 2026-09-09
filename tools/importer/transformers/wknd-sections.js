/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks + section metadata.
 * Driven by payload.template.sections (page-templates.json).
 *
 * Section boundaries are inserted in beforeTransform (before block parsers can
 * replace a section's boundary element), using a temporary marker <hr> as a
 * stable anchor. Section Metadata is inserted in afterTransform against that
 * marker. See generate-import-transformer.md "Why both hooks".
 *
 * article-page sections (all style: null → 2 breaks, 0 metadata blocks):
 *   s1 lead-image  main.cmp-layout-container--fixed > div > div > div.image.aem-GridColumn (cleaned.html:165)
 *   s2 breadcrumb  .breadcrumb.aem-GridColumn                (verified cleaned.html:170)
 *   s3 article-body .cmp-contentfragment__elements           (verified cleaned.html:201)
 *
 * adventure-detail sections (all style: null → 2 breaks, 0 metadata blocks):
 *   rc1 breadcrumb .breadcrumb.cmp-breadcrumb--fixed   (verified cleaned.html:165)
 *   rc2 gallery    .carousel.panelcontainer.cmp-carousel--mini (verified cleaned.html:181)
 *   rc3 detail     main.cmp-layout-container--fixed     (verified cleaned.html:211)
 *
 * homepage sections (4 breaks, 1 metadata block — s2 grey):
 *   s1 hero-carousel   .carousel.panelcontainer.cmp-carousel--hero (verified cleaned.html:165)
 *   s2 featured (grey) .teaser.cmp-teaser--featured                (verified cleaned.html:256)
 *   s3 recent-articles .title.cmp-title--underline                 (verified cleaned.html:276)
 *   s4 next-hero       .teaser.cmp-teaser--hero.cmp-teaser--imagebottom (verified cleaned.html:364)
 *   s5 where-to-go     .title:not(.cmp-title--underline)           (verified cleaned.html:386)
 *
 * NOTE: the previous s3/s5 selectors used main.cmp-layout-container--fixed:nth-of-type(N).
 * :nth-of-type counts same-tag siblings per parent — the two content <main> elements
 * (cleaned.html:253, :383) live under different parents, so neither is a 2nd <main>
 * sibling (s5 matched nothing) and :nth-of-type(1) resolved to the <main>@253 that is an
 * ANCESTOR of the featured teaser (s3 boundary landed above s2, collapsing s2–s4 into one
 * section and stranding the grey metadata). Class-based descendant boundaries fix both.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// section.selector may be a string or an array of selectors — normalize to the
// first matching element under `element`.
function findSectionEl(element, selector) {
  const selectors = Array.isArray(selector) ? selector : [selector];
  for (const sel of selectors) {
    if (!sel) continue;
    const el = element.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break, no metadata
      const sectionEl = findSectionEl(element, section.selector);
      if (!sectionEl) continue; // selector didn't match on this page — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers may have replaced section elements. Anchor each styled section's
    // Section Metadata block to whichever survives: the marker <hr> or the
    // original element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || findSectionEl(element, section.selector);
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove();
      }
    }
  }
}
