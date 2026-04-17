# CLAUDE.md — repo root

This is the monorepo for `jeffarnoldlabs.com`: landing page + `/blogs/*` + `/demos/*`, all under one domain. Single-developer project; AI agents assist heavily.

## Start here

- `README.md` — architecture, deployment model, runbook for adding a new demo.
- `AUTHORING.md` — day-to-day content authoring (new blog post, new demo page, styling conventions).
- `aiAgentProjectTasks/` — queued work for agents. See `aiAgentProjectTasks/README.md` for the convention.
- `aiAgentWorkHistory/` — one markdown entry per completed substantive piece of work. Write one when you finish a non-trivial task.

## Subsystem docs (read when you're touching that area)

- `site/CLAUDE.md` — Astro app (frontend for everything: landing, blog, all demo UIs).
- `infra/CLAUDE.md` — shared SAM stack (S3, CloudFront, ACM, Route53, OIDC, IAM roles).
- `demos/CLAUDE.md` — per-demo backend pattern (SAM stacks for Lambda/API Gateway).

## Layout in one glance

```
site/            # Astro static app — all frontend code lives here
infra/           # shared SAM stack (CloudFront + S3 + certs + IAM)
demos/<name>/    # per-demo backend SAM stacks only (frontends live in site/)
scripts/         # deploy-site.sh and future ops helpers
.github/workflows/  # path-filtered CI per deployable unit
```

## Constraints that surprise people

- **Split by deployable unit, not URL path.** Demo frontends live in `site/src/pages/demos/<name>/`; demo *backends* live in `demos/<name>/backend/`. Do not co-locate them.
- **pnpm workspaces** at the root. Use `pnpm --filter @jeffarnoldlabs/site <cmd>` to run site-specific scripts.
- **Astro 4 is pinned.** Do not upgrade to Astro 5 without also handling `@astrojs/sitemap` (currently pinned to `3.2.1` for Astro 4 compatibility).
- **HSTS preload is live** (via `infra/template.yaml`). Any subdomain of `jeffarnoldlabs.com` must serve HTTPS from first response.
- **TypeScript is strict** (`astro/tsconfigs/strict`). No implicit `any`.
- **`trailingSlash: 'never'` + `build.format: 'directory'`** are coupled. CloudFront Function bridges them. Changing one requires changing the other and the function.

## Operating principles

- Don't invent new foundational pillars without an entry in `aiAgentProjectTasks/`. Scope creep shows up as "while I was here I also added…" — keep those in separate tasks.
- Keep this file short. If something belongs in `README.md` or `AUTHORING.md`, put it there and link to it.
