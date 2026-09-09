I'll investigate the homepage structure and importer to build an accurate plan.Bash is blocked in plan mode. Let me use read-only tools instead.Let me examine the current homepage "Recent Articles" section and the recent-articles block.Let me review the cards parser and page-templates config to design the importer change precisely.Now let me check the recent-articles block source and how it reads config, plus confirm the "Where do you want to go?" section also uses cards (so I only replace the Recent Articles one).Let me check for captured source DOM to determine a unique selector for the Recent Articles image-list.I have enough to build the plan. Let me confirm the block CSS exists and the identifying markup for the two card grids.Before finalizing the plan, I need to confirm the locale scope, since only two homepage locales are currently imported but the request mentions "other local pages."# Recent Articles Block on Homepage Plan

## Status: awaiting approval — execution requires Execute mode

Replace the static `cards` grid in the **Recent Articles** section of every homepage locale with the dynamic `recent-articles` block, which reads the query index and sorts newest-first by `lastModified` (since the `date` metadata was removed and the index now has `lastModified` populated for all 67 rows).

## Confirmed findings

- **Block exists and works.** `blocks/recent-articles/{js,css}` already reads `/query-index.json`, sorts by `date` → falls back to `lastModified`, shows 4 cards/page with prev/next paging, and supports `source` / `filter` / `limit` config rows.
- **Index is ready.** All 67 rows have `lastModified`; `date` is empty (intentionally). The block's `entryDate()` already falls back to `lastModified`.
- **Homepage structure.** In each homepage (`content/{locale}.plain.html`), the Recent Articles section is row 3: `<h2>Recent Articles</h2>` + a `.cards` grid + an "All Articles" link + `<h2>Next Adventures</h2>`. A **second** `.cards` grid appears later under "Where do you want to go?" (the adventures grid) — that one must be **left as `cards`**.
- **Importer.** `tools/importer/import-homepage.js` maps the homepage; section `s3` (`recent-articles`) currently uses the `cards` block. The Recent Articles image-list is uniquely identifiable: it is the `.image-list.list` under the title `.cmp-title--underline` (the "Where do you want to go?" grid is under a non-underline title, section `s5`).

## Decisions (from user)

- **Scope:** All **11 homepage locales** (`ca/en, ca/fr, ch/de, ch/fr, ch/it, de/de, es/es, fr/fr, it/it, us/en, us/es`) — re-import each (creates the 9 not yet imported, updates the 2 existing).
- **Filter:** Magazine articles, **locale-scoped** — each homepage's block filters to `/{locale}/magazine/` and sorts newest-first.

## Approach

Change happens in the **importer** (never hand-edit content), so the Recent Articles section emits a `recent-articles` block with a locale-scoped `filter` row instead of a `cards` block. Then re-import all 11 homepage locales.

1. **New parser** `tools/importer/parsers/recent-articles.js`: given the Recent Articles `.image-list.list` element, build a `recent-articles` block whose config rows carry `filter = /{locale}/magazine/` (locale derived from the import `params.originalURL` path, e.g. `/us/en` → `/us/en/magazine/`). It emits the standard EDS block table (`Recent Articles` header + a `filter` row). It does **not** enumerate the source cards — the block populates itself at runtime from the index.
2. **Wire it in `import-homepage.js`:**
   - Import the new parser; register it as `'recent-articles'`.
   - In `PAGE_TEMPLATE.blocks`, add `recent-articles` scoped to the Recent Articles image-list only: selector `.title.cmp-title--underline ~ * .image-list.list` (or, more robustly, the image-list that is a sibling/descendant following the underline title). Keep `cards` mapped to the "Where do you want to go?" grid (section `s5`) only.
   - Update section `s3` to `blocks: ['recent-articles']`.
   - Ensure the "Recent Articles" `<h2>` default content and the "All Articles" CTA link are preserved (they sit outside the block).
3. **Disambiguate the two image-lists** so `cards` no longer claims the Recent Articles grid and `recent-articles` doesn't claim the adventures grid — verified via the `.cmp-title--underline` vs non-underline title that precedes each.
4. **Rebuild the bundle** (`esbuild --bundle --format=iife --global-name=CustomImportScript`) → `import-homepage.bundle.js`.
5. **Re-import all 11 homepage locales** via `run-bulk-import.js --import-script import-homepage.bundle.js --urls urls-homepage.txt --force`.
6. **Confirm the block already defaults correctly**: `source` defaults to same-origin `/query-index.json` (correct for production); the per-locale `filter` row makes each homepage show only its locale's magazine articles.

## Risks / notes

- **Locale filter accuracy:** the index must contain magazine rows for each locale. `us/en` and `ca/en` are confirmed present; other locales' magazine articles must be indexed/published or their block will render empty (block degrades gracefully to nothing). Will verify per-locale row counts against the live index during execution and flag any empty locales.
- **Selector disambiguation** is the main correctness risk — must ensure exactly one image-list maps to `recent-articles` and the other stays `cards`. Will validate on `us/en` first before running all 11.
- **lastModified ties:** the 5 magazine articles were republished together, so four share the same second — order among those four is arbitrary but stable. (Noted previously; unchanged by this work.)
- Same-origin fetch means no CORS issue in production (the earlier localhost cross-origin test failure was a harness artifact only).

## Checklist

- [ ] Verify the live index has magazine rows for each of the 11 locales; note any locale with zero magazine entries (block will render empty there)
- [ ] Create `tools/importer/parsers/recent-articles.js` — builds a `recent-articles` block with a locale-scoped `filter = /{locale}/magazine/` row, deriving locale from `params.originalURL`
- [ ] Update `tools/importer/import-homepage.js`: import + register the new parser; map `recent-articles` to the underline-title image-list; keep `cards` mapped only to the "Where do you want to go?" grid; set section `s3` blocks to `['recent-articles']`
- [ ] Confirm the "Recent Articles" heading and "All Articles" CTA remain as default content (outside the block)
- [ ] Rebuild `import-homepage.bundle.js` with esbuild (iife, global-name CustomImportScript)
- [ ] Dry-run/import `us/en` first; verify `content/us/en.plain.html` has a `recent-articles` block (with filter row) in section 3 and the adventures grid is still `cards`
- [ ] Re-import all 11 homepage locales (`urls-homepage.txt`, `--force`)
- [ ] Preview `us/en`: Recent Articles renders 4 cards from the index, newest-first by lastModified, prev/next paging works; adventures grid unchanged
- [ ] Spot-check 1–2 other locales (e.g. `ca/en`, `de/de`) for correct locale-scoped filtering / graceful empty state
- [ ] `stylelint` (recent-articles.css) + `eslint` (recent-articles.js, parser) clean
- [ ] Re-run homepage validation gates (content completeness, breakpoint, fetch-path) and re-critique the Recent Articles section vs source

> ⚠️ **Execution requires Execute mode.** This artifact makes no file changes; approve/switch to Execute mode and I'll implement the checklist in order.
