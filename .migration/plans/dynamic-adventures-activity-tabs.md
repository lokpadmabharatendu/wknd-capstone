# Dynamic "Current Adventures" Tabs Plan

## Status: approved — ready to execute (switch to Execute mode to run)
The plan is confirmed. No files have been changed yet. **Switch to Execute mode and I'll implement the checklist in order.** One step (adding the `activity` query-index column at tools.aem.live) is a user action outside the repo; the block is built to degrade gracefully until it's in place.

## Goal
Make the **Current Adventures** section on `/us/en/adventures` dynamic. The `tabs-listing` block reads the query index at runtime and builds:
- An **All** tab showing every adventure article.
- One tab per **Activity** (Climbing, Cycling, Skiing, Surfing, Travel, …) derived from the adventure pages themselves — so a newly published adventure with a new activity is grouped automatically (and a new tab appears if its activity is new).

## Decisions (from user)
- **Activity source:** Add an `Activity` **metadata field** to each adventure page via the importer, re-import all adventure-detail pages, and expose an `activity` column in the query-index config (tools.aem.live). The block groups by that field.
- **Block:** Convert the existing **`tabs-listing`** block to dynamic (same name, same card/tab markup + CSS). The importer emits a small config table instead of static per-tab tables.
- **Ordering:** Adventures **newest-first by `lastModified`** within each tab; activity tabs sorted alphabetically after a leading **All** tab.

## Current-state findings
- `content/us/en/adventures.plain.html` → `Current Adventures` heading + a `tabs-listing` block with **static** tables (tabs `All, Climbing, Cycling, Skiing, Surfing, Travel`, each a hand-authored card table). This is what we replace.
- Each adventure page (e.g. `bali-surf-camp.plain.html`) has its **Activity** in a `table-specs` block in the body (`Activity → Surfing`), **not** in metadata. 16 adventures exist under `/us/en/adventures/`.
- The query index exposes only `path, title, date, description, image, lastModified` — **no activity**. Hence activity must be pushed into metadata + a new index column.
- `blocks/tabs-listing/tabs-listing.js` builds tabs from authored child rows; `tabs-listing.css` styles the tab bar + reshapes card content into a 4-up grid. The dynamic block builds the same DOM shape so CSS keeps working.
- `blocks/recent-articles/recent-articles.js` is the proven "fetch `/query-index.json` → filter → sort by `lastModified` → build cards" pattern; the dynamic tabs block reuses this approach and its `entryDate`/`createOptimizedPicture` helpers.
- The adventures listing page has its own importer/template (adventure-listing); its `tabs-listing` mapping must emit the dynamic config instead of static tables. (Confirm the exact import script during execution.)

## Approach

### A. Surface Activity into the index (data)
1. **Adventure-detail importer** (`import-adventure-detail.js` + bundle): after block parsing, read the Activity value from the parsed `table-specs` (row whose label cell is "Activity") and append an `Activity` row to the page's **Metadata** block. Rebuild bundle.
2. **Re-import** all `/us/en/adventures/*` detail pages so each carries `<meta name="activity">`.
3. **Query-index config** (tools.aem.live, user action): add an `activity` column mapping to `<meta name="activity">`, re-index/republish. (Same pattern as the earlier `lastModified` addition; verify per-row values before relying on them.)

### B. Dynamic tabs-listing block (rendering)
4. **`blocks/tabs-listing/tabs-listing.js`**: detect dynamic mode when the block contains a `filter` config row rather than authored tab tables. In dynamic mode:
   - Fetch `/query-index.json` (configurable `source`), filter rows by `filter` prefix (`/us/en/adventures/`), excluding the listing page itself and non-detail paths.
   - Read each row's `activity`; collect the distinct set.
   - Build tabs: **All** (every row) + one per distinct activity, alphabetical.
   - Sort each tab newest-first by `lastModified` (reuse `entryDate`).
   - Render each panel as the existing card grid markup (image + `h3>a` title + description) so `tabs-listing.css` is unchanged; wire the existing tab show/hide behavior.
   - Graceful fallback: if the index is unreachable or has no `activity` values yet, render the **All** tab only so the page never breaks.
5. Keep the static-table code path intact for backward compatibility (locales not re-imported / offline preview).

### C. Importer for the adventures listing page (authoring)
6. Update the **adventure-listing importer** (owner of `/us/en/adventures`) so the `tabs-listing` section emits a **config block** — `| tabs-listing | filter | /us/en/adventures/ |` — instead of static tab tables. Mirror in `page-templates.json`. Rebuild bundle and re-import `us/en/adventures` (and `ca/en/adventures` if in scope). Preserve the `Current Adventures` heading and hero above it.

### D. Verify
7. Preview `/us/en/adventures`: All lists all adventures; activity tabs match each page's Activity; tab switching works; card grid matches source; newest-first order.
8. Lint (stylelint + eslint); re-run adventure-listing validation gates.

## Risks / notes
- **Index dependency:** activity tabs are empty until the `activity` column is configured at tools.aem.live and pages republished. Block degrades to All-only meanwhile (verified against the live index during execution).
- **Activity label source:** relies on the `table-specs` "Activity" row existing on every adventure; pages missing it fall into All only (logged, not grouped).
- **Tab set is data-driven:** a new adventure with a new activity creates a new tab automatically; no code change. All + alphabetical coincides with the source order for the current five activities.
- **Locale scope:** targets `us/en`; `ca/en` can be re-imported the same way if desired (confirm at execution).
- Content is regenerated only via the import pipeline (no hand-editing of `content/`).

## Checklist
- [ ] Confirm which import script/template owns `/us/en/adventures` (adventure-listing) and locate its `tabs-listing` mapping
- [ ] Verify live query-index columns / whether any `activity` field exists; capture per-adventure Activity values from the pages
- [ ] Update `import-adventure-detail.js` to emit an `Activity` metadata row from the parsed table-specs; rebuild bundle
- [ ] Re-import all `/us/en/adventures/*` detail pages; verify each `.plain.html` metadata has `Activity`
- [ ] (User) Add `activity` column to the query-index config at tools.aem.live and republish; verify rows expose `activity`
- [ ] Convert `blocks/tabs-listing/tabs-listing.js` to dynamic mode (fetch index, filter, group by activity, sort newest-first, build All + per-activity tabs) with static-mode fallback
- [ ] Ensure rendered DOM matches existing `tabs-listing.css` (tab bar + 4-up card grid); adjust CSS only if needed
- [ ] Update the adventure-listing importer + `page-templates.json` so the Current Adventures section emits `| tabs-listing | filter | /us/en/adventures/ |`; rebuild bundle
- [ ] Re-import `us/en/adventures` (and `ca/en/adventures` if in scope); confirm the config block replaced the static tables and the heading/hero are intact
- [ ] Preview `/us/en/adventures`: All shows every adventure; activity tabs correct; switching works; newest-first; styling matches source
- [ ] Graceful-fallback check: block renders All-only if `activity` not yet in the index
- [ ] stylelint + eslint clean; re-run adventure-listing validation gates

> ⚠️ **Execution requires Execute mode.** This artifact makes no file changes. Approve/switch to Execute mode and I'll implement the checklist in order. The one external step (adding the `activity` query-index column at tools.aem.live) is a user action; the block degrades gracefully until it's in place.
