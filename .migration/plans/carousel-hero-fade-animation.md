# Carousel-Hero Animation & Content-Width Fix Plan

## Status: approved — execution requires Execute mode

The plan is confirmed and ready. Both reported issues were verified against the live source; the steps below are ready to run. **No files have been changed yet — switch to Execute mode to apply this plan.**

## Confirmation of the reported issues

I inspected the live source (`wknd.site/us/en`) vs the migrated block. Both issues are **confirmed**:

### 1. Carousel animation IS different
| Aspect | Source (`cmp-carousel--hero`) | Migrated (`carousel-hero`) |
|--------|-------------------------------|-----------------------------|
| Mechanism | Inactive slides `display: none`; active slide `.cmp-carousel__item--active`, `position: static`, `transition: all` | Horizontal **scroll-snap** track (`overflow: scroll`, `scroll-snap-type: x`) with `scrollTo({behavior:'smooth'})` |
| Visual effect | **In-place swap** (one slide occupies space; no sideways motion) | **Horizontal slide** — the strip scrolls left/right |

The migrated block slides sideways; the original swaps in place. They must match.

### 2. slide-content width differs
- Source content box padding `0 14px`; on desktop a **fixed-width white card overlapping the image bottom**, not `full-width minus margins`.
- Migrated `.carousel-hero-slide-content` uses `margin: -180px 44px 0` → width is `carouselWidth − 88px` (much wider than source).
- Exact desktop pixel width will be re-measured at 1440px during execution (plan-mode probe ran at reduced viewport).

## Approach

Rework `blocks/carousel-hero/carousel-hero.js` + `carousel-hero.css` so the carousel:
1. **Stacks slides** (each slide absolutely positioned / display-toggled in the same box) and transitions with an **opacity fade** — matching the AEM core-component behavior — instead of a horizontal scroll-snap strip.
2. Keeps the existing indicators (dots) + prev/next chevrons and their wiring; only the transition mechanism changes.
3. Constrains `.carousel-hero-slide-content` to the **source card width** (measured at desktop), keeping the `-180px` bottom overlap and `18px 28px` padding.
4. Preserves autoplay only if the source has it (probe returned no `data-cmp-autoplay`/`delay` — re-verify at execution; do not add autoplay the source lacks).

CSS/JS-only change to a shared block → applies to all homepage locales, **no re-import needed**.

## Checklist

- [ ] Re-measure at desktop (1440px): source carousel content-box width, left offset, confirm fade vs cut (opacity transition timing), and any autoplay/delay attributes
- [ ] Rework `carousel-hero.js`: replace scroll-snap navigation (`scrollTo`) with stacked slides toggled by an `is-active` class; keep `showSlide`, indicators, prev/next, and active-slide tracking
- [ ] Update `carousel-hero.css`: stack slides (absolute positioning within a fixed-aspect container), add opacity crossfade transition, remove `overflow: scroll` / `scroll-snap` track styles
- [ ] Constrain `.carousel-hero-slide-content` width to the source card width (retain `-180px` overlap, `18px 28px` padding, yellow CTA)
- [ ] Verify on migrated preview: single slide visible at a time, fade (not slide) on dot/arrow click, correct content-box width, full-bleed 1440×640 image retained
- [ ] Confirm mobile behavior still works (content box `-48px 16px` overlap, dots/arrows)
- [ ] `stylelint` (carousel-hero.css) + `eslint` (carousel-hero.js) clean
- [ ] Re-run nav/block validation gates (validate-nav-content, breakpoint, fetch-path) and re-critique the homepage carousel vs source

> ⚠️ **Execution requires Execute mode.** This artifact makes no file changes; approve/switch to Execute mode and I'll implement the checklist in order.
