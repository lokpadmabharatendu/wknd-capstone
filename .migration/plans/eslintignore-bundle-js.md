# Add `*.bundle.js` to `.eslintignore` Plan

## What this task is (explanation)
`npm run lint` runs `lint:js` = **`eslint .`**, which recursively lints every `.js` file in the repo. That sweep currently includes the **6 esbuild-generated importer bundles** under `tools/importer/*.bundle.js`:

- `import-adventure-detail.bundle.js`
- `import-adventure-listing.bundle.js`
- `import-article-page.bundle.js`
- `import-faq-page.bundle.js`
- `import-homepage.bundle.js`
- `import-landing-page.bundle.js`

These are **build artifacts**, not authored source — machine-generated, minified-ish IIFEs (`var CustomImportScript = (() => { ... })()`). esbuild strips leading comments, so they carry **no `/* eslint-disable */` header**. When `eslint .` (airbnb-base config) lints them, they trip many rules (`no-var`, `no-plusplus`, `no-restricted-syntax`, `vars-on-top`, `camelcase`, etc.), so **`npm run lint:js` exits non-zero**.

Consequence: `npm run lint` fails on generated code, which means:
- **CI can't trust the lint gate** — a red lint run reflects the bundles, not real problems in authored code, so genuine lint regressions get lost in the noise (or the gate gets ignored).
- Local `npm run lint` is noisy and discourages running it.

**The fix:** add `*.bundle.js` to `.eslintignore` (which already ignores `helix-importer-ui` and `*.min.js`). eslint then skips the generated bundles, lints only authored source, and **`npm run lint` exits zero when the real code is clean** — a signal CI can rely on. The parsers/importers that *generate* the bundles (`tools/importer/*.js`, which are `/* eslint-disable */`-headed or authored) are unaffected.

## Current state (verified)
- `.eslintignore` contains exactly: `helix-importer-ui` and `*.min.js` — **no** `*.bundle.js` entry.
- `package.json` → `"lint:js": "eslint ."` (whole-repo scan); `"lint": "npm run lint:js && npm run lint:css"`.
- 6 `*.bundle.js` files exist under `tools/importer/`; the sampled bundle starts with `var CustomImportScript = (() => {` and has no eslint-disable header.
- `.eslintrc.js` extends `airbnb-base` with no `ignorePatterns` for bundles.

## Approach
Append a single pattern to `.eslintignore`:
```
*.bundle.js
```
- Matches all six generated bundles (pattern is path-agnostic, like the existing `*.min.js`).
- Leave `.eslintrc.js`, `package.json` scripts, and stylelint config unchanged — no rule or script edits needed.
- Rationale mirrors the existing `*.min.js` ignore: generated/vendored JS shouldn't be linted.

## Verify (execution)
- Run `npx eslint .` (or `npm run lint:js`) → confirm **exit 0** and that no `*.bundle.js` path appears in output.
- Run full `npm run lint` → confirm **exit 0** (js + css).
- Sanity: confirm authored files are still linted (e.g. a deliberate temp error in a block is still caught) — i.e. the ignore is scoped to bundles only, not silencing real source.

## Risks / notes
- **Low risk, additive.** Only excludes build artifacts from linting; authored source (blocks, scripts, importer parsers) remains fully linted.
- If any future authored file were ever named `*.bundle.js`, it would be skipped — not a concern here (all bundles are generated), but worth knowing.
- Does not change what ships or how bundles are built; purely a lint-scope change so the gate is trustworthy.
- Optional follow-up (not required): also add `tools/importer/*.bundle.js` to `.hlxignore` if the intent is to stop *serving* them — separate concern from linting; out of scope unless requested.

## Checklist
- [ ] Confirm `npm run lint:js` currently exits non-zero due to `tools/importer/*.bundle.js`
- [ ] Add `*.bundle.js` to `.eslintignore` (below the existing `*.min.js` line)
- [ ] Run `npm run lint:js` → verify exit 0 and no bundle paths in output
- [ ] Run `npm run lint` (js + css) → verify exit 0 overall
- [ ] Confirm authored source is still linted (ignore is scoped to bundles only)
- [ ] Commit `.eslintignore` on a branch and open a PR with the required preview link (never commit to `main`)

> ⚠️ **Execution requires Execute mode.** This artifact makes no file changes. Approve/switch to Execute mode and I'll apply the one-line `.eslintignore` change and verify lint exits zero. Pushing/PR uses auto-injected credentials only if the Settings opt-in is enabled.
