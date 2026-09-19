Let me investigate the repo state before finalizing anything — whether a helix-query.yaml already exists, how the index is currently referenced, and the ignore rules.I need to resolve one contradiction and one scope choice before finalizing the plan.# Commit helix-query.yaml With the Code Plan

## Status: awaiting approval — execution requires Execute mode
No files changed yet. This plan adds a versioned `helix-query.yaml` to the repo so the query-index definition lives alongside the blocks that depend on it. **Per your decision, tools.aem.live remains the live source of truth**; the committed file documents/versions the definition in-repo (not a behavior switch).

## Goal
Create and commit a `helix-query.yaml` at the repo root that captures the exact query-index the dynamic blocks rely on — the **single default `/query-index.json`** with the columns those blocks read — so the index contract is reviewable in PRs and travels with the code.

## Decisions (from user)
- **Source of truth:** Keep **tools.aem.live** as the live index config. Commit `helix-query.yaml` to version/document the definition next to the code; do **not** claim it overrides the platform. AGENTS.md's "retired" note stays accurate for runtime, but gets a clarifying line that the file is kept in-repo as the canonical definition.
- **Scope:** A **single default index** at `/query-index.json` covering the whole site. All blocks fetch `/query-index.json` and filter client-side by path — no per-section indices needed.

## Why this is safe / correct
- `helix-query.yaml` is **not a served asset**; `.hlxignore` already excludes dotfiles/other files, and index YAML isn't delivered to visitors — so committing it has no front-end serving impact.
- The blocks that consume the index today:
  - `blocks/recent-articles/recent-articles.js` — reads `path, title, image, description`, sorts by `date`→`lastModified`, filters by `/{locale}/{magazine|adventures}/`.
  - `blocks/tabs-listing/tabs-listing.js` — reads `path, title, image, description, lastModified`, groups by `activity`.
  - `blocks/hero/hero.js` — looks up `title, description` by `path`.
- So the index must expose columns: **`path` (implicit), `title`, `date`, `description`, `image`, `lastModified`, `activity`** — exactly what we'll declare.

## The file to add (`/helix-query.yaml`)
A standard EDS index definition, e.g.:
```yaml
version: 1
indices:
  default:
    include:
      - '/**'
    exclude:
      - '/drafts/**'
      - '/tools/**'
    target: /query-index.json
    properties:
      title:
        select: head > meta[property="og:title"]
        value: attribute(el, "content")
      description:
        select: head > meta[name="description"]
        value: attribute(el, "content")
      image:
        select: head > meta[property="og:image"]
        value: attribute(el, "content")
      lastModified:
        select: none
        value: parseTimestamp(headers("last-modified"), "ddd, DD MMM YYYY hh:mm:ss GMT")
      date:
        select: head > meta[name="date"]
        value: attribute(el, "content")
      activity:
        select: head > meta[name="activity"]
        value: attribute(el, "content")
```
Exact selector/value expressions will be **reconciled against the current tools.aem.live definition during execution** (the plan verifies the live index columns first and mirrors them, so the committed file matches production rather than guessing). `activity` was the column added for the adventures tabs; `lastModified`/`date` drive the newest-first sorting.

## Approach
1. **Verify the live definition** — read the current tools.aem.live index (columns + property expressions) so the YAML mirrors production exactly, not an approximation.
2. **Author `helix-query.yaml`** at repo root with the single `default` index and the seven properties above.
3. **Keep it in-repo but non-authoritative** — add a short header comment in the YAML stating tools.aem.live is the live source and this file is the versioned reference; update AGENTS.md's "Outdated" line to note the file is retained as the canonical definition (documentation), not the runtime source.
4. **Confirm serving/ignore posture** — ensure `helix-query.yaml` isn't required to be `.hlxignore`d (config YAML isn't served); leave `.hlxignore` unchanged unless verification shows otherwise.
5. **Validate** — `yaml`-lint / parse the file; sanity-check that its columns are the superset every block reads.
6. **Commit on a branch + open PR** — per AGENTS.md, never commit to `main` directly; branch, commit `helix-query.yaml` (+ AGENTS.md note), and open a PR including the required `{branch}--{repo}--{owner}.aem.page/{path}` preview link. Credentials are auto-injected; if git/preview auth fails, that's the LLM-permissions opt-in (I won't request a token in chat).

## Risks / notes
- **Not a live switch:** committing the file does not, by itself, repoint the platform away from tools.aem.live. If you later want the repo to be authoritative, that's a separate platform change (the other AskUserQuestion option) — flagged, not done here.
- **Drift:** if someone edits tools.aem.live without updating the YAML, the two can diverge. The header comment + PR review process mitigate this; keeping them in sync is a process note.
- **Selector accuracy:** the `lastModified`/timestamp expression must match what the platform actually uses; execution reconciles against the live config before finalizing.
- No block code changes; purely additive config + docs.

## Checklist
- [ ] Read the current tools.aem.live query-index definition; record its columns + property expressions
- [ ] Cross-check the columns every consuming block needs (`recent-articles`, `tabs-listing`, `hero`) → confirm `title, date, description, image, lastModified, activity`
- [ ] Author `/helix-query.yaml` (single `default` index → `/query-index.json`) mirroring the live definition, with a header comment noting tools.aem.live is the live source
- [ ] Update AGENTS.md "Outdated" line to note `helix-query.yaml` is retained in-repo as the versioned/canonical definition (docs), tools.aem.live still runtime
- [ ] Confirm `helix-query.yaml` needs no `.hlxignore` entry (index YAML is not a served asset); leave `.hlxignore` unchanged
- [ ] Validate the YAML parses and columns are a superset of what blocks read
- [ ] Create a branch, commit `helix-query.yaml` (+ AGENTS.md note); do not commit to `main`
- [ ] Open a PR with a description and the required `{branch}--{repo}--{owner}.aem.page` preview link
- [ ] (Deferred/optional) If the repo should become the live source, make the tools.aem.live switch as a separate, explicit step

> ⚠️ **Execution requires Execute mode.** This artifact makes no file changes. Approve/switch to Execute mode and I'll implement the checklist in order. Pushing the branch/opening the PR uses auto-injected credentials only if the Settings opt-in is enabled — no token will be requested in chat.
