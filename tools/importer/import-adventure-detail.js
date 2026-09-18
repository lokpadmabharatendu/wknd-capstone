/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselGalleryParser from './parsers/carousel-gallery.js';
import tableSpecsParser from './parsers/table-specs.js';
import tabsDetailParser from './parsers/tabs-detail.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'adventure-detail',
  description: 'Detail page: breadcrumbs, image carousel gallery, and a tabbed content region with itinerary/description details',
  urls: [
    'https://wknd.site/us/en/adventures/bali-surf-camp.html',
  ],
  blocks: [
    {
      name: 'carousel-gallery',
      instances: ['.carousel.panelcontainer.cmp-carousel--mini', 'div.carousel.cmp-carousel--mini'],
    },
    {
      name: 'table-specs',
      instances: ['.cmp-contentfragment__elements', '.cmp-contentfragment.cmp-contentfragment--bali-surf-camp'],
    },
    {
      name: 'tabs-detail',
      instances: ['.tabs.panelcontainer', 'div.tabs.panelcontainer .cmp-tabs'],
    },
  ],
  sections: [
    {
      id: 'rc1', name: 'breadcrumb', selector: '.breadcrumb.cmp-breadcrumb--fixed',
      style: null, blocks: [], defaultContent: ['.cmp-breadcrumb'],
    },
    {
      id: 'rc2', name: 'gallery', selector: ['.carousel.panelcontainer.cmp-carousel--mini'],
      style: null, blocks: ['carousel-gallery'], defaultContent: [],
    },
    {
      id: 'rc3', name: 'detail', selector: 'main.cmp-layout-container--fixed',
      style: null, blocks: ['table-specs', 'tabs-detail'], defaultContent: ['.cmp-title__text'],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'carousel-gallery': carouselGalleryParser,
  'table-specs': tableSpecsParser,
  'tabs-detail': tabsDetailParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  wkndCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [wkndSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
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

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return; // avoid double-mapping across union selectors
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 0. Capture the Activity value BEFORE parsers run (the table-specs parser
    // replaces the content-fragment element). The source exposes it on a stable
    // class; fall back to matching the "Activity" label row. Emitted as an
    // `Activity` metadata row below so the query-index can carry an `activity`
    // column and the adventures listing can group by it.
    let activityValue = '';
    const activityEl = document.querySelector(
      '.cmp-contentfragment__element--activity .cmp-contentfragment__element-value',
    );
    if (activityEl) {
      activityValue = activityEl.textContent.trim();
    } else {
      const els = document.querySelectorAll('.cmp-contentfragment__element');
      els.forEach((el) => {
        if (activityValue) return;
        const t = el.querySelector('.cmp-contentfragment__element-title, dt');
        const v = el.querySelector('.cmp-contentfragment__element-value, dd');
        if (t && v && t.textContent.trim().toLowerCase() === 'activity') {
          activityValue = v.textContent.trim();
        }
      });
    }

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced by an earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5b. Append an "Activity" row to the Metadata block (the last <table>
    // created by createMetadata) so the published page emits <meta name="activity">
    // and the query-index can group adventures by activity.
    if (activityValue) {
      const tables = main.querySelectorAll('table');
      const metaTable = tables[tables.length - 1];
      if (metaTable) {
        const tr = document.createElement('tr');
        const keyCell = document.createElement('td');
        keyCell.textContent = 'Activity';
        const valCell = document.createElement('td');
        const valP = document.createElement('p');
        valP.textContent = activityValue;
        valCell.append(valP);
        tr.append(keyCell, valCell);
        (metaTable.querySelector('tbody') || metaTable).appendChild(tr);
      }
    }

    // 6. Generate sanitized path
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
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
