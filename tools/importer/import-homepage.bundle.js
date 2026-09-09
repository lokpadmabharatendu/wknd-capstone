/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document: document2 }) {
    const items = element.querySelectorAll(".cmp-carousel__item, .cmp-teaser--hero");
    const slideEls = element.querySelectorAll(".cmp-carousel__item").length ? element.querySelectorAll(".cmp-carousel__item") : element.querySelectorAll(".cmp-teaser--hero");
    const cells = [];
    slideEls.forEach((slide) => {
      const teaser = slide.querySelector(".cmp-teaser") || slide;
      const image = teaser.querySelector(".cmp-teaser__image img, .cmp-image img, img");
      const heading = teaser.querySelector(".cmp-teaser__title, h1, h2, h3");
      const description = teaser.querySelector(".cmp-teaser__description, p");
      const cta = teaser.querySelector(".cmp-teaser__action-link, .cmp-teaser__action-container a, a");
      if (!image && !heading && !description) return;
      const contentCell = [];
      if (heading) contentCell.push(heading);
      if (description) contentCell.push(description);
      if (cta) contentCell.push(cta);
      cells.push([image || "", contentCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse2(element, { document: document2 }) {
    const teaser = element.querySelector(".cmp-teaser") || element;
    const pretitle = teaser.querySelector(".cmp-teaser__pretitle");
    const heading = teaser.querySelector(".cmp-teaser__title, h1, h2, h3");
    const description = teaser.querySelector(".cmp-teaser__description, p:not(.cmp-teaser__pretitle)");
    const cta = teaser.querySelector(".cmp-teaser__action-link, .cmp-teaser__action-container a, a");
    const image = teaser.querySelector(".cmp-teaser__image img, .cmp-image img, img");
    const textCell = [];
    if (pretitle) textCell.push(pretitle);
    if (heading) textCell.push(heading);
    if (description) textCell.push(description);
    if (cta) textCell.push(cta);
    if (!textCell.length && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[textCell, image || ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero.js
  function parse3(element, { document: document2 }) {
    const teaser = element.querySelector(".cmp-teaser") || element;
    const image = teaser.querySelector(".cmp-teaser__image img, .cmp-image img, img");
    const heading = teaser.querySelector(".cmp-teaser__title, h1, h2, h3");
    const description = teaser.querySelector(".cmp-teaser__description, p:not(.cmp-teaser__pretitle)");
    const cta = teaser.querySelector(".cmp-teaser__action-link, .cmp-teaser__action-container a, a");
    if (!heading && !description && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([image || ""]);
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse4(element, { document: document2 }) {
    const items = element.querySelectorAll(".cmp-image-list__item, li");
    const cells = [];
    items.forEach((item) => {
      const image = item.querySelector(".cmp-image-list__item-image img, .cmp-image img, img");
      const titleEl = item.querySelector(".cmp-image-list__item-title");
      const titleLink = item.querySelector(".cmp-image-list__item-title-link");
      const description = item.querySelector(".cmp-image-list__item-description");
      if (!image && !titleEl && !description) return;
      let heading = "";
      const titleText = titleEl ? titleEl.textContent.trim() : "";
      if (titleText) {
        heading = document2.createElement("h3");
        const href = titleLink ? titleLink.getAttribute("href") : null;
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = titleText;
          heading.append(a);
        } else {
          heading.textContent = titleText;
        }
      }
      const bodyCell = [];
      if (heading) bodyCell.push(heading);
      if (description) {
        const p = document2.createElement("p");
        p.textContent = description.textContent.trim();
        bodyCell.push(p);
      }
      cells.push([image || "", bodyCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "iframe"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.cmp-experiencefragment--header",
        "footer.cmp-experiencefragment--footer",
        "#toggleNav",
        "#mobileNav",
        ".sharing",
        "meta",
        "link",
        "noscript"
      ]);
      element.querySelectorAll(".title .cmp-title__text").forEach((el) => {
        if (el.textContent.trim() === "Share this Adventure") {
          const titleWrapper = el.closest(".title");
          if (titleWrapper) titleWrapper.remove();
        }
      });
      element.querySelectorAll("[data-cmp-data-layer], [data-cmp-hook-image]").forEach((el) => {
        el.removeAttribute("data-cmp-data-layer");
        el.removeAttribute("data-cmp-hook-image");
      });
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function findSectionEl(element, selector) {
    const selectors = Array.isArray(selector) ? selector : [selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = element.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = findSectionEl(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || findSectionEl(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Localized landing/home page: full-width carousel hero, featured-article columns, cards grids, and hero banner sections",
    urls: [
      "https://wknd.site/us/en.html"
    ],
    blocks: [
      { name: "carousel-hero", instances: [".carousel.panelcontainer.cmp-carousel--hero"] },
      { name: "columns", instances: [".teaser.cmp-teaser--featured"] },
      { name: "hero", instances: [".teaser.cmp-teaser--hero.cmp-teaser--imagebottom", ".teaser.cmp-teaser--hero"] },
      { name: "cards", instances: [".image-list.list"] }
    ],
    sections: [
      { id: "s1", name: "hero-carousel", selector: ".carousel.panelcontainer.cmp-carousel--hero", style: null, blocks: ["carousel-hero"], defaultContent: [] },
      { id: "s2", name: "featured-article", selector: ".teaser.cmp-teaser--featured", style: "grey", blocks: ["columns"], defaultContent: [] },
      { id: "s3", name: "recent-articles", selector: ".title.cmp-title--underline", style: null, blocks: ["cards"], defaultContent: [".cmp-title__text"] },
      { id: "s4", name: "next-adventures-hero", selector: ".teaser.cmp-teaser--hero.cmp-teaser--imagebottom", style: null, blocks: ["hero"], defaultContent: [".cmp-title__text"] },
      { id: "s5", name: "where-to-go-adventures", selector: ".title:not(.cmp-title--underline)", style: null, blocks: ["cards"], defaultContent: [".cmp-title__text"] }
    ]
  };
  var parsers = {
    "carousel-hero": parse,
    columns: parse2,
    hero: parse3,
    cards: parse4
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
