/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Removes non-authorable global chrome and widgets from wknd.site pages.
 * All selectors verified against migration-work/cleaned.html (adventure-detail
 * originally; article-page selectors verified against the arctic-surfing capture).
 * NOTE: breadcrumb (.breadcrumb.cmp-breadcrumb--fixed) is intentionally kept —
 * the adventure-detail template maps it as authorable section rc1; the
 * article-page breadcrumb (.breadcrumb.aem-GridColumn) is likewise authorable (s2).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Tracking iframe (Adobe demdex) — verified: iframe#destination_publishing_iframe_wkndsite_0
    WebImporter.DOMUtils.remove(element, [
      'iframe',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome (verified in cleaned.html):
    //  - header.cmp-experiencefragment--header (contains logo, language nav, main nav, search)
    //  - footer.cmp-experiencefragment--footer (logo, footer nav, social buttons, copyright)
    //  - #toggleNav / #mobileNav (mobile navigation)
    // Non-authorable in-content widgets:
    //  - .sharing (empty Facebook/Pinterest share widget)
    //  - stray empty <meta> tags left over from core-component markup
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      '#toggleNav',
      '#mobileNav',
      '.sharing',
      'meta',
      'link',
      'noscript',
    ]);

    // Article-page (magazine) non-authorable furniture — verified in cleaned.html
    // (arctic-surfing capture). Guarded by class specificity so these are no-ops
    // on templates that don't have them (idempotent, page-agnostic):
    //  - div.experiencefragment / .cmp-experiencefragment--jacob-wester (cleaned.html:271)
    //    Author byline experience fragment (photo, name, occupations, social buttons).
    //    NOTE: matches ONLY the in-body author XF — the site header/footer XFs are
    //    <header>/<footer> tags (not div.experiencefragment), and the "By Jacob Wester"
    //    <h4> title (cleaned.html:195) lives OUTSIDE this XF and is kept as content.
    //  - aside.cmp-layoutcontainer--sidebar (cleaned.html:330)
    //    "SHARE THIS STORY" title + share widget + ".list.cmp-list--upnext" related/up-next list.
    WebImporter.DOMUtils.remove(element, [
      'div.experiencefragment',
      'aside.cmp-layoutcontainer--sidebar',
    ]);

    // Remove the "Share this Adventure" title that labels the removed .sharing widget.
    element.querySelectorAll('.title .cmp-title__text').forEach((el) => {
      if (el.textContent.trim() === 'Share this Adventure') {
        const titleWrapper = el.closest('.title');
        if (titleWrapper) titleWrapper.remove();
      }
    });

    // Strip AEM data-layer / cmp tracking attributes wherever present.
    element.querySelectorAll('[data-cmp-data-layer], [data-cmp-hook-image]').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-cmp-hook-image');
    });
  }
}
