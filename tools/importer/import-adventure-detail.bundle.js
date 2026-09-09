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

  // tools/importer/import-adventure-detail.js
  var import_adventure_detail_exports = {};
  __export(import_adventure_detail_exports, {
    default: () => import_adventure_detail_default
  });

  // tools/importer/parsers/carousel-gallery.js
  function parse(element, { document: document2 }) {
    let slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    if (!slides.length) {
      slides = Array.from(element.querySelectorAll(".cmp-image, .image")).map((img) => img.closest(".cmp-carousel__item") || img);
    }
    const cells = [];
    slides.forEach((slide) => {
      const image = slide.querySelector("img");
      if (!image) return;
      const textNodes = Array.from(slide.querySelectorAll("h1, h2, h3, h4, h5, h6, p, .cmp-title__text")).filter((n) => !n.closest(".cmp-carousel__actions") && !n.closest(".cmp-carousel__action"));
      const links = Array.from(slide.querySelectorAll("a")).filter((a) => !a.closest(".cmp-carousel__actions"));
      const contentCell = [...textNodes, ...links];
      cells.push([image, contentCell.length ? contentCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-gallery", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-specs.js
  function parse2(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll(".cmp-contentfragment__element"));
    const cells = [];
    items.forEach((item) => {
      const label = item.querySelector(".cmp-contentfragment__element-title, dt");
      const value = item.querySelector(".cmp-contentfragment__element-value, dd");
      const labelText = label ? label.textContent.trim() : "";
      const valueText = value ? value.textContent.trim() : "";
      if (!labelText && !valueText) return;
      cells.push([labelText, valueText]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-specs", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-detail.js
  function parse3(element, { document: document2 }) {
    const labels = Array.from(element.querySelectorAll(".cmp-tabs__tablist .cmp-tabs__tab, ol.cmp-tabs__tablist > li"));
    const panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    const cells = [];
    labels.forEach((label, i) => {
      const panel = panels[i];
      const labelText = label ? label.textContent.trim() : "";
      let contentRoot = panel ? panel.querySelector(".cmp-contentfragment__elements") : null;
      if (!contentRoot && panel) contentRoot = panel;
      const contentCell = [];
      if (contentRoot) {
        Array.from(contentRoot.querySelectorAll("p, ul, ol, h1, h2, h3, h4, h5, h6, img")).filter((n) => {
          if (n.tagName === "IMG") return true;
          return n.textContent.trim().length > 0 || n.querySelector("img");
        }).forEach((n) => contentCell.push(n));
      }
      if (!labelText && !contentCell.length) return;
      cells.push([labelText, contentCell.length ? contentCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-detail", cells });
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

  // tools/importer/import-adventure-detail.js
  var PAGE_TEMPLATE = {
    name: "adventure-detail",
    description: "Detail page: breadcrumbs, image carousel gallery, and a tabbed content region with itinerary/description details",
    urls: [
      "https://wknd.site/us/en/adventures/bali-surf-camp.html"
    ],
    blocks: [
      {
        name: "carousel-gallery",
        instances: [".carousel.panelcontainer.cmp-carousel--mini", "div.carousel.cmp-carousel--mini"]
      },
      {
        name: "table-specs",
        instances: [".cmp-contentfragment__elements", ".cmp-contentfragment.cmp-contentfragment--bali-surf-camp"]
      },
      {
        name: "tabs-detail",
        instances: [".tabs.panelcontainer", "div.tabs.panelcontainer .cmp-tabs"]
      }
    ],
    sections: [
      {
        id: "rc1",
        name: "breadcrumb",
        selector: ".breadcrumb.cmp-breadcrumb--fixed",
        style: null,
        blocks: [],
        defaultContent: [".cmp-breadcrumb"]
      },
      {
        id: "rc2",
        name: "gallery",
        selector: [".carousel.panelcontainer.cmp-carousel--mini"],
        style: null,
        blocks: ["carousel-gallery"],
        defaultContent: []
      },
      {
        id: "rc3",
        name: "detail",
        selector: "main.cmp-layout-container--fixed",
        style: null,
        blocks: ["table-specs", "tabs-detail"],
        defaultContent: [".cmp-title__text"]
      }
    ]
  };
  var parsers = {
    "carousel-gallery": parse,
    "table-specs": parse2,
    "tabs-detail": parse3
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
  var import_adventure_detail_default = {
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
  return __toCommonJS(import_adventure_detail_exports);
})();
