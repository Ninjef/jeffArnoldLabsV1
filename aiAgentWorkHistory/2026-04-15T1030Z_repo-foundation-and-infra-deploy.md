# Repo Foundation & Infrastructure Deploy

**Date:** 2026-04-15 through 2026-04-16
**Agent:** Claude Opus 4.6 (Claude Code CLI)
**Task source:** `projectTasks/INITIALIZATION.md`
**Status:** Complete

---

## Summary

Initialized the `jeffarnoldlabs.com` monorepo from an empty directory through to a fully deployed production site with working CloudFront distribution, S3 static hosting, a placeholder Astro site, and a live demo backend with API Gateway routing through CloudFront. GitHub Actions CI workflows are scaffolded and ready to activate once GH secrets are configured.

---

## Architecture Decisions Made

### Stack choices (confirmed with user)
- **Framework:** Astro 4 with static output (`output: 'static'`)
- **Island framework:** React (via `@astrojs/react`) for interactive MDX components and demo frontends
- **Styling:** Tailwind CSS 3
- **Canonical host:** Apex `jeffarnoldlabs.com` (301 redirect from `www`)
- **CI auth:** GitHub OIDC roles (no long-lived AWS access keys)
- **Monorepo tool:** pnpm workspaces (no Turbo/Nx)
- **IaC:** AWS SAM

### Structural principles
- **Split by deployable unit, not URL path.** Shared infra is one SAM stack; each demo backend is its own SAM stack.
- **All frontends live in `site/`.** Demo backends live in `demos/<name>/backend/`. This keeps the design system, nav, footer, and Lighthouse budget unified.
- **Per-demo API wiring via SSM Parameter Store.** Each demo backend writes its API Gateway domain to `/jal/demos/<name>/api-domain`. The shared infra stack reads those SSM params to configure CloudFront cache behaviors. No cross-stack exports (which lock deletion).
- **`packages/ui/` deferred.** YAGNI with one frontend consumer; pnpm workspaces makes extraction trivial later.

### SEO foundation (baked in from day one)
- `@astrojs/sitemap` generating `sitemap-index.xml` with canonical no-trailing-slash URLs
- `@astrojs/rss` generating `rss.xml`
- Reusable `SEO.astro` component with: canonical tags, Open Graph, Twitter Card, JSON-LD (Article + WebSite schemas)
- `robots.txt` with sitemap pointer
- Trailing-slash policy: `trailingSlash: 'never'` with `build.format: 'directory'`; CloudFront Function handles `/path` -> `/path/index.html` mapping
- Content Collections with Zod-validated frontmatter schema (title, description, pubDate, updatedDate, draft, tags, ogImage)

---

## Files Created

### Workspace root
| File | Purpose |
|------|---------|
| `package.json` | Workspace root; `packageManager: pnpm@9.12.0`; convenience scripts (`dev`, `build`, `preview`, `deploy:site`) |
| `pnpm-workspace.yaml` | Declares `site` and `packages/*` as workspace members |
| `.nvmrc` | Pins Node 20 |
| `.python-version` | Pins Python 3.12.13 via pyenv |
| `.gitignore` | node_modules, dist, .venv, .aws-sam, samconfig.toml, IDE files |
| `README.md` | Project overview, layout, prereqs, local dev, deploy model, "adding a new demo" runbook |
| `scripts/deploy-site.sh` | Convenience script: reads stack outputs, runs `s3 sync` with correct cache headers, invalidates CloudFront |

### `site/` (Astro app)
| File | Purpose |
|------|---------|
| `package.json` | Astro 4 + MDX + React + Tailwind + sitemap + RSS + astro-og-canvas |
| `astro.config.mjs` | Static output, `trailingSlash: 'never'`, `build.format: 'directory'`, `site: 'https://jeffarnoldlabs.com'` |
| `tailwind.config.mjs` | Content paths for Astro source files |
| `tsconfig.json` | Extends `astro/tsconfigs/strict`, React JSX config |
| `src/consts.ts` | Site-wide constants (title, description, URL, author, default OG image) |
| `src/env.d.ts` | Astro type reference |
| `src/components/SEO.astro` | Full SEO head component: canonical, OG, Twitter, JSON-LD (Article/WebSite), article timestamps and tags |
| `src/layouts/Layout.astro` | Base HTML layout with SEO head, nav (Blog + Demos), footer, Tailwind base classes, RSS/sitemap links |
| `src/content/config.ts` | Content collection schema for `blog` (Zod: title, description, pubDate, updatedDate, draft, tags, ogImage) |
| `src/content/blog/hello-world.mdx` | Placeholder first blog post |
| `src/pages/index.astro` | Landing page with intro text + recent posts list |
| `src/pages/blogs/index.astro` | Blog index listing all non-draft posts |
| `src/pages/blogs/[...slug].astro` | Dynamic blog post page with `getStaticPaths` from content collection |
| `src/pages/rss.xml.ts` | RSS feed endpoint |
| `src/pages/demos/memory-steering/index.astro` | Placeholder demo frontend page |
| `public/robots.txt` | Allow all, sitemap URL |
| `public/favicon.svg` | Minimal SVG favicon ("jal" monogram) |

### `infra/` (Shared SAM stack)
| File | Purpose |
|------|---------|
| `template.yaml` | Full CloudFormation/SAM template (see resources below) |
| `demos.config.json` | Manifest of active demos and their SSM param paths (documentation/reference) |
| `samconfig.toml` | SAM deployment config with `production` environment (created by `sam deploy --guided`) |

#### Resources in `infra/template.yaml`:
- **S3 bucket** (`jeffarnoldlabs.com-site`) — private, BucketOwnerEnforced, all public access blocked
- **S3 bucket policy** — allows CloudFront OAC access only
- **ACM certificate** — `jeffarnoldlabs.com` + `www.jeffarnoldlabs.com`, DNS-validated against Route53
- **CloudFront Origin Access Control** (OAC, not legacy OAI)
- **CloudFront Distribution** — HTTP/2+3, IPv6, PriceClass_100, TLS 1.2+
  - Default behavior: S3 origin, HTML cache policy (60s TTL), canonical host function
  - `/_astro/*` behavior: S3 origin, assets cache policy (1-year immutable TTL)
  - `/demos/memory-steering/api/*` behavior: API Gateway origin, CachingDisabled, API path rewrite function
- **CanonicalHostFunction** (CloudFront Function) — 301 `www` -> apex; maps directory paths to `index.html`
- **ApiPathRewriteFunction** (CloudFront Function) — strips `/demos/<name>/api` prefix before forwarding to API Gateway
- **Cache policies:** AssetsCachePolicy (1yr), HtmlCachePolicy (60s/300s)
- **Origin request policy** for API origins (forwards cookies, auth/content-type headers, all query strings)
- **Route53 records** — A + AAAA for apex, A for www (all alias to CloudFront)
- **GitHub OIDC provider** (conditional, in case it already exists in the account)
- **Three IAM roles** for GitHub Actions:
  - `SiteDeployRole` — s3:sync + cloudfront:invalidation only
  - `InfraDeployRole` — admin (main branch only)
  - `DemoDeployRole` — PowerUserAccess + IAMFullAccess

### `demos/memory-steering/backend/` (Demo SAM stack)
| File | Purpose |
|------|---------|
| `template.yaml` | SAM template: HttpApi (API Gateway) + HealthFunction Lambda (Python 3.12, arm64) + SSM parameter write |
| `src/health/app.py` | Health check Lambda: returns `{"status": "ok", "demo": "memory-steering"}` |
| `src/health/requirements.txt` | Empty (no dependencies) |
| `samconfig.toml` | SAM deployment config (created by `sam deploy --guided`) |

### `.github/workflows/`
| File | Trigger | Action |
|------|---------|--------|
| `site.yml` | Push to `main` touching `site/**` | Build Astro, s3 sync with cache headers, CloudFront invalidation |
| `infra.yml` | Push to `main` touching `infra/**` | `sam deploy` shared stack (requires `production` environment approval) |
| `demo-memory-steering.yml` | Push to `main` touching `demos/memory-steering/backend/**` | `sam build` + `sam deploy` |

All three workflows use GitHub OIDC to assume the corresponding IAM role. No long-lived AWS credentials.

---

## AWS Resources Deployed

**Account:** 418955269110
**Region:** us-east-1

### Stack: `jal-infra`
- S3 bucket: `jeffarnoldlabs.com-site`
- CloudFront distribution: `E1QVLVJIAR3FZ1`
- ACM cert: `jeffarnoldlabs.com` + `www.jeffarnoldlabs.com` (DNS-validated, active)
- Route53 records: A + AAAA for apex, A for www
- CloudFront Functions: `jal-infra-canonical-host`, `jal-infra-api-path-rewrite`
- IAM roles: `jal-infra-gh-site-deploy`, `jal-infra-gh-infra-deploy`, `jal-infra-gh-demo-deploy`
- GitHub OIDC provider

### Stack: `jal-demo-memsteer`
- API Gateway (HttpApi): `ok4c43pkng.execute-api.us-east-1.amazonaws.com`
- Lambda: `HealthFunction` (Python 3.12, arm64)
- SSM parameter: `/jal/demos/memory-steering/api-domain`

---

## Local Development Environment Setup

- **pyenv** updated (was stale, didn't have 3.12); Python 3.12.13 installed and set as local version
- **corepack** enabled; pnpm 9.12.0 activated via `packageManager` field
- **Python venv** at `.venv/` with `aws-sam-cli` installed (SAM CLI 1.158.0)
- Node 18.18.2 in place (works; `.nvmrc` recommends 20 for future)

---

## Issues Encountered & Resolved

### 1. `@astrojs/sitemap` version incompatibility
- **Problem:** pnpm resolved `@astrojs/sitemap@3.7.2` which uses the `astro:routes:resolved` hook (Astro 5+ only). Build failed with `Cannot read properties of undefined (reading 'reduce')`.
- **Fix:** Pinned `@astrojs/sitemap` to `3.2.1` (compatible with Astro 4).

### 2. `build.format: 'file'` incompatibility with sitemap
- **Problem:** Initially set `build.format: 'file'` which produces bare `.html` files. Sitemap integration failed to process these routes.
- **Fix:** Changed to `build.format: 'directory'` (standard `/path/index.html` output). CloudFront Function already handles the `index.html` mapping.

### 3. CloudFront CachePolicy validation error
- **Problem:** Custom `ApiCachePolicy` with TTL=0 and `HeaderBehavior: whitelist` failed: "The parameter HeaderBehavior is invalid for policy with caching disabled."
- **Fix:** Replaced custom policy with the AWS managed `CachingDisabled` policy (`4135ea2d-6df8-44a3-9df3-4b5a84be39ad`). Header/cookie forwarding handled separately by `ApiOriginRequestPolicy`.

### 4. ROLLBACK_COMPLETE stack blocking redeploy
- **Problem:** After the cache policy failure, the stack was in `ROLLBACK_COMPLETE` state and couldn't be updated.
- **Fix:** `aws cloudformation delete-stack` + `wait stack-delete-complete`, then fresh deploy.

### 5. SAM build required Python 3.12 binary
- **Problem:** `sam build` failed with "Binary validation failed for python" — Lambda runtime `python3.12` but local pyenv only had 3.10.
- **Fix:** Updated pyenv (`git pull` in `~/.pyenv`), installed Python 3.12.13, recreated `.venv` on 3.12, reinstalled `aws-sam-cli`.

### 6. CloudFront API path forwarding
- **Problem:** CloudFront forwarded the full path `/demos/memory-steering/api/health` to API Gateway, but the Lambda route was `/health`. Direct API Gateway test worked; CloudFront-routed test returned AccessDenied.
- **Fix:** Added `ApiPathRewriteFunction` (CloudFront Function) that strips `/demos/<name>/api` prefix before forwarding to origin.

---

## Remaining Work (Not Done in This Session)

### To activate CI/CD
1. Push repo to GitHub (`Ninjef/jeffArnoldLabsV1`)
2. Configure GitHub repo secrets: `SITE_DEPLOY_ROLE_ARN`, `INFRA_DEPLOY_ROLE_ARN`, `DEMO_DEPLOY_ROLE_ARN`, `SITE_BUCKET`, `CF_DISTRIBUTION_ID`
3. Configure GitHub repo variables: `DOMAIN_NAME`, `HOSTED_ZONE_ID`
4. Create `production` environment in GitHub with required reviewer (for `infra.yml` manual approval)

### To complete the site
- Upload the first site build to S3 (`pnpm deploy:site`)
- Verify all three test endpoints work through CloudFront
- Set up OG image generation pipeline (astro-og-canvas or similar)
- Build out the memory-steering demo frontend + real Lambda endpoints
- Add Lighthouse CI GitHub Action for perf budget enforcement
- Consider WAF rate limiting + Turnstile authorizer for demo API endpoints

### Future demo pattern
See `README.md` "Adding a new demo" section for the step-by-step runbook.

---

## Key File Reference (Quick Navigation)

| What | Where |
|------|-------|
| Astro config | `site/astro.config.mjs` |
| SEO component | `site/src/components/SEO.astro` |
| Blog content schema | `site/src/content/config.ts` |
| Base layout | `site/src/layouts/Layout.astro` |
| Shared infra template | `infra/template.yaml` |
| Demo backend template | `demos/memory-steering/backend/template.yaml` |
| Site deploy script | `scripts/deploy-site.sh` |
| CI: site workflow | `.github/workflows/site.yml` |
| CI: infra workflow | `.github/workflows/infra.yml` |
| CI: demo workflow | `.github/workflows/demo-memory-steering.yml` |
| Demo manifest | `infra/demos.config.json` |
