# CLAUDE.md — infra/

Shared AWS stack for `jeffarnoldlabs.com`. Single SAM template, deployed once, rarely touched. Owns: S3 origin, CloudFront, ACM cert, Route53 records, GitHub OIDC provider + IAM deploy roles, CloudFront Functions, response-headers policy.

Deployed as CloudFormation stack `jal-infra` in `us-east-1` (required for CloudFront + ACM).

## What lives here

| Resource | Role |
|---|---|
| `SiteBucket` | Private S3 bucket, served via CloudFront OAC only |
| `Certificate` | ACM cert for apex + `www`, DNS-validated |
| `Distribution` | The CloudFront distribution — origins, cache behaviors, default root object |
| `CanonicalHostFunction` | CloudFront Function: redirects `www` → apex, maps directory URIs → `index.html` |
| `ApiPathRewriteFunction` | CloudFront Function: strips `/demos/<name>/api` prefix before forwarding to the demo's API Gateway |
| `SiteResponseHeadersPolicy` | HSTS (preload), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy |
| `AssetsCachePolicy` / `HtmlCachePolicy` | 1-year immutable for `/_astro/*`, short for HTML |
| `ApiOriginRequestPolicy` | Forwards cookies, auth headers, query strings to demo API origins |
| `SiteDeployRole` / `InfraDeployRole` / `DemoDeployRole` | GitHub OIDC roles. Site role is locked to this bucket + invalidations. Infra role only from `main`. |

## HSTS preload is live

`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. Committed to the browser preload lists. Consequence:

- Every current **and future** subdomain of `jeffarnoldlabs.com` must serve HTTPS from day one. No HTTP-only services, ever.
- Reversing HSTS preload takes months of staged rollbacks before it clears browser-shipped lists.

If you ever need to stand up something on `*.jeffarnoldlabs.com` for testing, use a real cert — don't try to skip HTTPS.

## Adding a new demo's CloudFront wiring

This happens once per demo, after the demo's backend SAM stack has been deployed (so the SSM param exists).

1. Open `infra/template.yaml`. Find the `Distribution` resource.
2. Append a new origin under `Origins`:
   ```yaml
   - Id: api-<name>
     DomainName: !Sub '{{resolve:ssm:/jal/demos/<name>/api-domain}}'
     CustomOriginConfig:
       OriginProtocolPolicy: https-only
       OriginSSLProtocols: [TLSv1.2]
   ```
3. Append a new entry under `CacheBehaviors`:
   ```yaml
   - PathPattern: '/demos/<name>/api/*'
     TargetOriginId: api-<name>
     ViewerProtocolPolicy: redirect-to-https
     AllowedMethods: [GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE]
     Compress: true
     CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # AWS managed CachingDisabled
     OriginRequestPolicyId: !Ref ApiOriginRequestPolicy
     FunctionAssociations:
       - EventType: viewer-request
         FunctionARN: !GetAtt ApiPathRewriteFunction.FunctionARN
   ```
4. Add an entry to `demos.config.json` (documentation/reference for what SSM params exist).
5. Deploy via the `infra` GitHub Actions workflow (or `sam deploy` locally with `InfraDeployRole`).

Do **not** export cross-stack values for this. SSM is the coupling boundary — keeps the infra stack deletable without stack-dependency lockups.

## Why `ApiPathRewriteFunction` is generic

The regex `/^\/demos\/[^/]+\/api/` strips `/demos/<any-name>/api` before forwarding to origin. One CloudFront Function covers every demo. The per-demo work is only in `Distribution.Origins` and `Distribution.CacheBehaviors` — the function stays as-is.

## IAM roles (OIDC trust)

| Role | Trust sub | Permissions |
|---|---|---|
| `SiteDeployRole` | `repo:<org>/<repo>:*` (any branch) | Inline policy: `s3:*` on `SiteBucket` + `cloudfront:CreateInvalidation` on `Distribution` |
| `InfraDeployRole` | `repo:<org>/<repo>:ref:refs/heads/main` (main only) | `AdministratorAccess` managed policy (reviewed: this role needs to manage IAM, CloudFront, Route53, ACM, OIDC provider — near-admin anyway; main-branch-only trust is the main control) |
| `DemoDeployRole` | `repo:<org>/<repo>:*` (any branch) | `PowerUserAccess` + `IAMFullAccess` — needed to create Lambda execution roles |

If collaborators ever join, revisit InfraDeployRole scope and whether DemoDeployRole should be main-only.

## Things that would bite you

- **OIDC provider `ThumbprintList`** is a placeholder `ffff…` — that's fine because AWS validates the thumbprint automatically for `token.actions.githubusercontent.com`. Do not replace it with a real thumbprint unless you're ready to rotate it when GitHub updates their cert.
- `CreateOIDCProvider: 'true'` defaults to creating the provider. If it already exists in the account, set this to `'false'` on the next deploy (happens automatically across AWS accounts with multiple SAM-deployed repos).
- The `Distribution.Origins` and `CacheBehaviors` lists are hand-edited per demo. There is no template-generator; don't try to dynamically loop them via CloudFormation — CFN doesn't support that cleanly.
