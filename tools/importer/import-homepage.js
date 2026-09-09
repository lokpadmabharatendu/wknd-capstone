/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import columnsParser from './parsers/columns.js';
import heroParser from './parsers/hero.js';
import cardsParser from './parsers/cards.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Localized landing/home page: full-width carousel hero, featured-article columns, cards grids, and hero banner sections',
  urls: [
    'https://wknd.site/us/en.html',
  ],
  blocks: [
    { name: 'carousel-hero', instances: ['.carousel.panelcontainer.cmp-carousel--hero'] },
    { name: 'columns', instances: ['.teaser.cmp-teaser--featured'] },
    { name: 'hero', instances: ['.teaser.cmp-teaser--hero.cmp-teaser--imagebottom', '.teaser.cmp-teaser--hero'] },
    { name: 'cards', instances: ['.image-list.list'] },
  ],
  sections: [
    { id: 's1', name: 'hero-carousel', selector: '.carousel.panelcontainer.cmp-carousel--hero', style: null, blocks: ['carousel-hero'], defaultContent: [] },
    { id: 's2', name: 'featured-article', selector: '.teaser.cmp-teaser--featured', style: 'grey', blocks: ['columns'], defaultContent: [] },
    { id: 's3', name: 'recent-articles', selector: '.title.cmp-title--underline', style: null, blocks: ['cards'], defaultContent: ['.cmp-title__text'] },
    { id: 's4', name: 'next-adventures-hero', selector: '.teaser.cmp-teaser--hero.cmp-teaser--imagebottom', style: null, blocks: ['hero'], defaultContent: ['.cmp-title__text'] },
    { id: 's5', name: 'where-to-go-adventures', selector: '.title:not(.cmp-title--underline)', style: null, blocks: ['cards'], defaultContent: ['.cmp-title__text'] },
  ],
};

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  columns: columnsParser,
  hero: heroParser,
  cards: cardsParser,
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

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

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

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

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
