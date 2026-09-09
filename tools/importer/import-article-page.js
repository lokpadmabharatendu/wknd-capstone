/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS (article-page is all default content — no block parsers)
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'article-page',
  description: 'Editorial article page: lead image, breadcrumbs, title, pull quote, and stacked long-form default content sections',
  urls: [
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
  ],
  blocks: [],
  sections: [
    { id: 's1', name: 'lead-image', selector: 'main.cmp-layout-container--fixed > div > div > div.image.aem-GridColumn', style: null, blocks: [], defaultContent: ['.cmp-image'] },
    { id: 's2', name: 'breadcrumb', selector: '.breadcrumb.aem-GridColumn', style: null, blocks: [], defaultContent: ['.cmp-breadcrumb'] },
    { id: 's3', name: 'article-body', selector: '.cmp-contentfragment__elements', style: 'article-body', blocks: [], defaultContent: ['.cmp-contentfragment__title', 'blockquote'] },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  wkndCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [wkndSectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (cleanup + section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. No block parsers — article-page is entirely default content.

    // 3. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 3b. "Share this Story" related-articles rail. Appended as its own trailing
    // section (own <hr> break) so it renders as a right rail beside the article
    // body (blocks/related-articles). Locale-scoped to the current /magazine/
    // section so it lists sibling articles; the block excludes the current page
    // and sorts newest-first at runtime.
    (() => {
      let locale = '';
      try {
        const segs = new URL(params.originalURL).pathname
          .replace(/\/$/, '').replace(/\.html?$/, '')
          .split('/').filter(Boolean);
        if (segs.length >= 2) locale = `/${segs[0]}/${segs[1]}`;
      } catch (e) { /* leave locale empty */ }
      const filterPrefix = locale ? `${locale}/magazine/` : '/magazine/';

      main.appendChild(document.createElement('hr'));
      const block = WebImporter.Blocks.createBlock(document, {
        name: 'related-articles',
        cells: { title: 'Share this Story', filter: filterPrefix },
      });
      main.appendChild(block);
    })();

    // 4. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Sanitized path
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: [],
      },
    }];
  },
};
