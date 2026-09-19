Let me investigate the homepage "Next Adventures" hero, the hero block, and how a dynamic block could pull an adventure page.The "Next Adventures" hero is the `hero` block in row 4 with hardcoded image/title/description. Let me examine the hero block, the hero parser, and an adventure page's structure to design the dynamic fetch.Empty hero.js — the hero block relies on default EDS auto-decoration. Let me check the hero CSS and how the source adventure page's title/description/image live (to know what to fetch).Now let me look at the adventure page structure to know where to pull the "first image", title, and description. I already saw `bali-surf-camp.plain.html` earlier — the h1 title + table-specs + tabs. But the hero shows title + a description. Let me check the climbing-new-zealand page specifically.Now I have the complete data picture. The adventure page provides:
- **Title**: the h1 / metadata Title ("Climbing New Zealand")
- **Description**: metadata Description ("Let us help you make your New Zealand climbing vacation...") — matches the current hardcoded hero text
- **First image**: the first `<picture><img>` in the page (the carousel-gallery's first image, `sport-climbing.jpeg`)

The current hardcoded hero uses a *different* image (a tabs image), but the requirement says "take the first image from the page." Let me check the hero parser and how the block is decorated/fetched, plus how fragment.js fetches (the standard cross-block fetch pattern).Let me check the homepage importer's hero mapping and the fragment.js fetch pattern (the model for cross-page fetching).I have the fetch pattern. The `.plain.html` fetch works but for description I need the metadata block. `.plain.html` includes the metadata block as a `<div class="metadata">`, so I can read Description + Title from there, and the first `<picture><img>` for the image. Let me check the homepage importer's hero mapping and whether `getMetadata`-style extraction is feasible. Let me look at the homepage importer.I have a complete understanding. Let me confirm a few design decisions with the user before finalizing the plan — the key ambiguities are which image to use, the CTA, and whether to keep the hero block dynamic vs a new block.# Dynamic "Next Adventures" Hero Plan

## Goal
Replace the hardcoded `hero` block in the homepage **"Next Adventures"** section (`/us/en`) with a **dynamic** hero that references an adventure page (e.g. `/us/en/adventures/climbing-new-zealand`), fetches it at runtime, and renders the same UI:
- **Image** = the first image on the adventure page
- **Title** = the adventure page's title
- **Description** = the adventure page's description
- **CTA** = "See Trip" → the adventure page

## Decisions (from user)
- **Image source:** the literal **first `<picture>` image** on the adventure page (the carousel-gallery's first photo). This will differ from the current static hero image — expected/accepted.
- **Text source:** **metadata Title + Description** (title = h1/metadata Title, description = metadata Description). CTA "See Trip" → the adventure page.
- **Block:** **Reuse the existing `hero` block** — make `blocks/hero/hero.js` dynamic. Same `hero.css` and look. Static authoring remains a fallback.

## Current-state findings
- Homepage row 4: `hero` block with hardcoded image (`adobestock-140634652.jpeg`, a tab image), `<h2>Climbing New Zealand</h2>`, description, and a `See Trip` link to `/us/en/adventures/climbing-new-zealand.html`.
- `blocks/hero/hero.js` is **empty** (relies on EDS auto-block decoration of the two-row image/content structure). `hero.css` styles `.hero > div:first-child img` (full-bleed image) + `.hero > div:last-child` (white overlapping content box with h2/p/CTA).
- Adventure page (`climbing-new-zealand.plain.html`) provides: first image = carousel-gallery `sport-climbing.jpeg`; metadata `Title` = "Climbing New Zealand"; metadata `Description` = "Let us help you make your New Zealand climbing vacation a memory…"; and it's fetchable via `${path}.plain.html`.
- `blocks/fragment/fragment.js` is the established pattern for fetching another page's `.plain.html` client-side (incl. media base-path handling). The dynamic hero reuses this fetch approach (lightweight — no full `decorateMain`).
- Homepage importer maps the `hero` block to `.teaser.cmp-teaser--hero.cmp-teaser--imagebottom` (section `s4`). The parser (`parsers/hero.js`) currently emits the static image+content rows; it will instead emit a small config referencing the adventure path.

## Approach

### A. Dynamic hero block (rendering) — `blocks/hero/hero.js`
1. On decorate, detect **dynamic mode**: the block contains a single link/path to an adventure page (or a `reference`/config row) and no authored image+content rows.
2. Fetch `${path}.plain.html` (same-origin; fragment.js pattern), parse into a detached container, and rewrite relative media URLs to absolute against the adventure path.
3. Extract:
   - **image**: first `<picture>`/`<img>` in the fetched DOM.
   - **title**: metadata `Title` (from the `div.metadata` block) → fallback to the page's first `h1`.
   - **description**: metadata `Description` → fallback to first body `<p>`.
4. Build the **exact hero DOM** the CSS expects: `div > (div > picture)` (row 1, full-bleed image) + `div > (h2 + p + a.cta)` (row 2, white box). CTA text "See Trip", `href` = adventure path. Use `createOptimizedPicture` for the image so it's responsive.
5. Replace the block's contents with this structure so `hero.css` renders it unchanged.
6. **Fallback:** if the block already holds static authored image+content (no reference) or the fetch fails, leave the existing static markup intact so EDS auto-decoration / current look still works (never break the page).

### B. Importer (authoring) — `parsers/hero.js` + homepage template
7. Update `parsers/hero.js` so the homepage "Next Adventures" teaser emits a **reference block** instead of static rows — e.g.:
   ```
   | hero |
   | /us/en/adventures/climbing-new-zealand |
   ```
   Derive the adventure path from the source teaser's CTA link (the `See Trip` href), so it stays data-driven and locale-correct. Keep the static-emitting path available for any other hero usage that isn't an adventure teaser (guard on presence of an adventure CTA).
8. Confirm `page-templates.json` needs no structural change (block still mapped by the same selector). Rebuild the homepage bundle.
9. Re-import `us/en` (and `ca/en` homepage if in scope) so the `hero` block becomes the reference config; verify the `Next Adventures` heading and surrounding sections are preserved.

### C. Verify
10. Preview `/us/en`: the Next Adventures hero shows the adventure's **first image**, **title**, **description**, and a **See Trip** CTA to the adventure; styling matches the current hero (full-bleed image + overlapping white box).
11. Confirm dynamic updates: pointing the block at a different adventure path changes the rendered hero without re-import.
12. Lint (stylelint hero.css if touched + eslint hero.js/parser); re-run homepage validation gates.

## Risks / notes
- **First-image choice:** the first page image is the carousel-gallery photo, so the hero image will change vs. today's static image (per your instruction). Flagged, not a bug.
- **Client-side fetch:** one extra `.plain.html` request on homepage load; negligible. Fetch failure → graceful fallback (static/empty), never a broken hero.
- **Media base path:** adventure `.plain.html` images are absolute `https://wknd.site/...` today, so they resolve directly; the fragment-style relative-URL rewrite is kept as a safeguard for locally-hosted media.
- **Description length:** metadata Description is concise (matches the current hero copy), so no truncation needed; CSS already handles wrapping.
- **Locale:** targets `us/en`; `ca/en` homepage can get the same treatment on request (its adventure paths resolve the same way).
- Content is regenerated only via the import pipeline (no hand-editing of `content/`).

## Checklist
- [ ] Re-read `blocks/hero/hero.js` (empty) + `hero.css`; confirm the DOM shape the CSS requires (row1 image / row2 content box)
- [ ] Implement dynamic mode in `blocks/hero/hero.js`: detect adventure reference, fetch `${path}.plain.html`, extract first image + metadata Title + metadata Description, build hero DOM with "See Trip" CTA
- [ ] Add graceful fallback (static authored hero or fetch failure → leave existing markup, no error)
- [ ] Use `createOptimizedPicture` + absolute media URL handling (fragment.js pattern)
- [ ] Update `parsers/hero.js` to emit a reference block (adventure path from the teaser's CTA) for the Next Adventures hero; keep static path for non-adventure heroes
- [ ] Rebuild `import-homepage.bundle.js`; confirm `page-templates.json` unaffected
- [ ] Re-import `us/en` homepage; verify the hero block is now a reference to `/us/en/adventures/climbing-new-zealand` and the `Next Adventures` heading/sections are intact
- [ ] Preview `/us/en`: hero shows adventure's first image + title + description + See Trip CTA; matches current hero styling
- [ ] Verify graceful fallback (unreachable path → no broken hero) and that changing the referenced path updates the hero without re-import
- [ ] stylelint + eslint clean; re-run homepage validation gates
- [ ] (Optional, on request) apply the same dynamic hero to the `ca/en` homepage

> ⚠️ **Execution requires Execute mode.** This artifact makes no file changes. Approve/switch to Execute mode and I'll implement the checklist in order.
