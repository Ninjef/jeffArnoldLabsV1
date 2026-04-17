# jeffarnoldlabs

Personal site at `jeffarnoldlabs.com` — landing, technical blog (`/blogs/*`), and interactive demos (`/demos/*`) under one domain.

## Layout

```
site/                         # Astro app (landing + blog + demo frontends)
infra/                        # Shared SAM: CloudFront + S3 + ACM + Route53 + OIDC
demos/<name>/backend/         # Per-demo SAM stack (API Gateway + Lambdas)
.github/workflows/            # Path-filtered CI per deployable unit
```

Design principles: split by deployable unit, not URL path. All frontends live in `site/`; `demos/*/` holds only backend code.

## Prerequisites

- Node 20 (`nvm use`)
- pnpm (enabled via corepack: `corepack enable`)
- AWS SAM CLI

## Local dev

```bash
corepack enable
pnpm install
pnpm dev                      # astro dev on site/
pnpm build                    # static output in site/dist
```

## Deploy

Production deploys run in GitHub Actions via an OIDC-assumed IAM role (no long-lived keys).

- `site/**` changes → build Astro → `s3 sync` → CloudFront invalidate
- `demos/<name>/backend/**` changes → `sam deploy` the demo stack
- `infra/**` changes → `sam deploy` shared stack (manual approval)

## Adding a new demo

1. Create `demos/<name>/backend/template.yaml` modeled on `memory-steering`. It must write its API Gateway domain to SSM at `/jal/demos/<name>/api-domain`.
2. `sam deploy` the demo stack.
3. Append `{ "name": "<name>" }` to `infra/demos.config.json`.
4. Redeploy the `infra/` stack — CloudFront picks up the new `/demos/<name>/api/*` cache behavior.
5. Add a `.github/workflows/demo-<name>.yml` workflow (copy from `demo-memory-steering.yml`).
6. Add frontend pages under `site/src/pages/demos/<name>/`.
