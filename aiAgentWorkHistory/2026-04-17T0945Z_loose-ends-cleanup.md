# Loose Ends Cleanup

**Date:** 2026-04-17
**Agent:** Claude Opus 4.7 (Claude Code CLI)
**Task source:** `aiAgentProjectTasks/completed/2026-04-17T0915Z_LOOSE_ENDS_CLEANUP.md`
**Status:** Complete (changes staged in working tree; not yet committed or deployed)

---

## Summary

Audited the just-scaffolded repo for foundation cracks across `site/`, `infra/`, `demos/`, scripts, and CI. Closed twelve concrete gaps and added five `CLAUDE.md` / README files for subsystem documentation. Scope held tight to "fix what's broken or fragile" — explicitly deferred linting/formatting, OG generation pipeline, Lighthouse CI, IAM scope-down, and content schema expansion to future tasks.

User decisions captured in plan:
- **Security headers**: full set with HSTS preload
- **Lint/format**: skip
- **OG image**: static placeholder (per-post pipeline stays future work)

---

## Changes by tier

### Tier A — foundation cracks fixed

| # | Change | Files |
|---|---|---|
| A1 | Branded 404 page (CloudFront `CustomErrorResponses` already pointed at `/404.html`; nothing was generating it) | `site/src/pages/404.astro` (new) |
| A2 | Installed and registered `@tailwindcss/typography`. The `prose` classes already used in the home page and blog were silently no-ops. | `site/package.json`, `site/tailwind.config.mjs` |
| A3 | Static OG fallback. `consts.ts` referenced `/og/default.png` which didn't exist → broken social-card previews on every share. Generated a 1200×630 PNG via ImageMagick. | `site/public/og/default.png` (new) |
| A4 | Demos index page; nav now links to `/demos` instead of hardcoded `/demos/memory-steering`. | `site/src/pages/demos/index.astro` (new), `site/src/layouts/Layout.astro` |
| A5 | Optional `wide` prop on `Layout.astro` so future demos can break out of `max-w-3xl` without cloning the layout. Nav/footer stay centered. | `site/src/layouts/Layout.astro` |
| A6 | `astro check` script + CI step before build, so TS errors fail PRs instead of slipping into deploy. | `site/package.json`, `.github/workflows/site.yml` |
| A7 | `scripts/deploy-site.sh`: validates that the CFN outputs resolved (non-empty BUCKET/DIST), guards on missing `site/dist/`, and waits for CloudFront invalidation completion. CI workflow does the same wait. | `scripts/deploy-site.sh`, `.github/workflows/site.yml` |
| A8 | Concurrency groups on infra and demo workflows (site already had one). Added `sam validate --lint` to demo workflow (infra already had it). | `.github/workflows/infra.yml`, `.github/workflows/demo-memory-steering.yml` |
| A9 | Lambda log retention (30 days) via explicit `AWS::Logs::LogGroup` + `LoggingConfig.LogGroup` reference. Sets the pattern for future demo backends. | `demos/memory-steering/backend/template.yaml` |
| A10 | CloudFront `ResponseHeadersPolicy`: HSTS (max-age 2y, `includeSubdomains`, `preload`), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin. Attached to the default behavior and `/_astro/*`; left off API behaviors so backends control their own headers. | `infra/template.yaml` |
| C1 | Skip-to-content link + `<main id="main">` for keyboard accessibility. | `site/src/layouts/Layout.astro` |
| C2 | RSS items now include `<author>` (sourced from `SITE.author`) and `<category>` per tag. | `site/src/pages/rss.xml.ts` |

### Tier B — subfolder docs

New `CLAUDE.md` files capturing non-obvious constraints, gotchas, and runbooks for each subsystem:

- **Root `CLAUDE.md`** — expanded from one line to a navigation index with monorepo layout and pinned-version constraints
- **`site/CLAUDE.md`** — Astro mental model, pinned package versions and *why* (Astro 4 + sitemap 3.2.1), layout conventions, OG image story, scripts
- **`infra/CLAUDE.md`** — what's in the stack, the HSTS-preload commitment, runbook for wiring a new demo's CloudFront origin + cache behavior, IAM role table
- **`demos/CLAUDE.md`** — per-demo backend pattern, required conventions, runbook for adding a brand-new demo end-to-end
- **`aiAgentProjectTasks/README.md`** — filename convention, lifecycle, task file structure (this file's existence is itself documenting the convention by example)

Skipped a `.github/workflows/CLAUDE.md` — workflows are small enough that the patterns are covered in `infra/CLAUDE.md`.

---

## Decisions worth recording

- **HSTS preload chosen** despite irreversibility. Rationale: this is a personal site committed to HTTPS-only on the apex; future subdomains are expected to be HTTPS-only too. Documented in `infra/CLAUDE.md`.
- **InfraDeployRole kept at AdministratorAccess.** It needs to manage IAM, CloudFront, ACM, Route53, and the OIDC provider — near-admin anyway. Trust is restricted to `main` branch only. Revisit when collaborators appear. Documented in `infra/CLAUDE.md`.
- **Lambda log group strategy: explicit `AWS::Logs::LogGroup` resource referenced via `LoggingConfig.LogGroup`** with a custom name (`/aws/lambda/${AWS::StackName}/health`) rather than the default Lambda-auto-generated name. Avoids the typical conflict with pre-existing auto-created log groups on existing stacks. Caveat noted in `demos/CLAUDE.md`: the existing `jal-demo-memsteer` deploy already auto-created a log group at the default path; the next deploy will create a new log group at the new path and orphan the old one. Manual cleanup of the orphan is a one-time chore.
- **No tests added.** Out of scope per the task spec. The verification path is type-check + build + `sam validate`, all of which run in CI now.

---

## Verification performed

- `pnpm install` — clean
- `pnpm --filter @jeffarnoldlabs/site check` — 0 errors / 0 warnings / 0 hints
- `pnpm --filter @jeffarnoldlabs/site build` — 6 pages built, including `/404.html`, `/demos/index.html`, `/demos/memory-steering/index.html`, OG image at `/og/default.png`, RSS with `<author>` and `<category>` elements
- `sam validate --lint -t infra/template.yaml` — valid
- `sam validate --lint -t demos/memory-steering/backend/template.yaml` — valid

Not yet performed (require live AWS deploy):
- `sam deploy` of `jal-infra` to actually publish the security headers (curl verification of `strict-transport-security`, `x-frame-options`, etc. comes after the deploy)
- `sam deploy` of `jal-demo-memsteer` to land the new log group + retention (will require one-time manual cleanup of the auto-created orphan log group)
- End-to-end CI run on a branch to confirm the new type-check and invalidation-wait steps behave correctly

---

## Out of scope (intentional, not gaps)

These were surfaced during the audit but explicitly held back:

- Prettier/ESLint
- `astro-og-canvas` per-post OG generation pipeline
- Lighthouse CI
- WAF / Turnstile on demo APIs
- CloudWatch alarms, AWS Budgets, X-Ray tracing
- IAM role scope-down (InfraDeployRole, DemoDeployRole)
- Content collection schema expansion (author, series, coverImage, readingTime)
- Tags browsing pages
- Astro 5 upgrade

Most of these were already noted as future work in the initial scaffolding history. They're left untouched on purpose — task scope was foundation cracks, not new architecture.

---

## Files changed

**New:**
- `site/src/pages/404.astro`
- `site/src/pages/demos/index.astro`
- `site/public/og/default.png`
- `site/CLAUDE.md`
- `infra/CLAUDE.md`
- `demos/CLAUDE.md`
- `aiAgentProjectTasks/README.md`

**Modified:**
- `CLAUDE.md` (root, expanded)
- `site/package.json`
- `site/tailwind.config.mjs`
- `site/src/layouts/Layout.astro`
- `site/src/pages/rss.xml.ts`
- `scripts/deploy-site.sh`
- `.github/workflows/site.yml`
- `.github/workflows/infra.yml`
- `.github/workflows/demo-memory-steering.yml`
- `infra/template.yaml`
- `demos/memory-steering/backend/template.yaml`
- `pnpm-lock.yaml` (auto-updated by pnpm install)

**Moved:**
- `aiAgentProjectTasks/2026-04-17T0915Z_LOOSE_ENDS_CLEANUP.md` → `aiAgentProjectTasks/completed/`
