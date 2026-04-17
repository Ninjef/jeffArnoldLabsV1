# CLAUDE.md — demos/

Per-demo backend SAM stacks. Each demo's backend is an independently deployable CloudFormation stack. **Frontends do not live here** — they live in `site/src/pages/demos/<name>/` so they share the design system, nav, footer, and Lighthouse budget.

## The pattern

```
demos/<name>/backend/
├── template.yaml      # SAM: HttpApi + Lambdas + SSM param
├── src/               # Lambda source, one subdir per function
│   └── <function>/
│       ├── app.py
│       └── requirements.txt
└── samconfig.toml     # deployment config (gitignored via .gitignore)
```

Each demo:
- Runs one SAM stack, one HttpApi.
- Publishes its API Gateway domain to SSM at `/jal/demos/<name>/api-domain`.
- Gets wired into CloudFront by one-time edits to `infra/template.yaml` — see `../infra/CLAUDE.md`.
- Is called from the frontend via `/demos/<name>/api/*`. CloudFront strips the `/demos/<name>/api` prefix before forwarding to origin (shared `ApiPathRewriteFunction`).

## Required conventions when adding a new demo

1. **Outputs**: emit `ApiEndpoint` (full URL, for local testing) and `ApiDomainSsmPath` (the `/jal/demos/<name>/api-domain` value, for reference).
2. **SSM parameter**: write `${Api}.execute-api.${AWS::Region}.amazonaws.com` to `/jal/demos/<name>/api-domain`. CloudFront reads it via `{{resolve:ssm:…}}`.
3. **CORS**: hardcode `AllowOrigins: [https://jeffarnoldlabs.com]`. If you ever need preview domains, parameterize — don't open to `*`.
4. **Log retention**: every Lambda gets an explicit `AWS::Logs::LogGroup` resource with `RetentionInDays: 30`, referenced from the function's `LoggingConfig.LogGroup`. Don't let log groups auto-create — they default to retain-forever and quietly cost money.
5. **Runtime**: Python 3.12, `arm64`. Reasonable memory (512 MB) and timeout (15 s) are set via `Globals > Function`.
6. **Stack naming**: `jal-demo-<shortname>` (e.g. `jal-demo-memsteer`). Keep it recognizable in the AWS console.

## Adding a brand-new demo (runbook)

1. `mkdir demos/<name>/backend/src/<first-function>`; write `app.py` + `requirements.txt`.
2. Copy `memory-steering/backend/template.yaml` as a starting point. Replace stack name, SSM path, function names.
3. `sam deploy --guided` locally (first time) to produce `samconfig.toml`.
4. After the first successful deploy, the SSM param exists — then edit `infra/template.yaml` (see `../infra/CLAUDE.md` → "Adding a new demo's CloudFront wiring").
5. Add `.github/workflows/demo-<name>.yml` — copy `demo-memory-steering.yml` and update paths.
6. Add the frontend entry under `site/src/pages/demos/<name>/` and the listing in `site/src/pages/demos/index.astro`.

## Things that would bite you

- **CORS is hardcoded to the prod origin.** Local dev that calls the prod API from `localhost` will be blocked. For local end-to-end, either call `sam local start-api` or add a localhost origin temporarily.
- **SSM parameter order matters.** Deploy the demo backend *before* editing `infra/template.yaml` to reference its SSM param. Otherwise the infra deploy fails with `ParameterNotFound`.
- **Don't cross-stack-export API domains.** The SSM indirection exists so infra and demos can be deleted independently. Cross-stack exports create deletion locks.
- **Log group pre-creation**: if a demo was deployed before the explicit log group pattern was added, the auto-created log group will conflict with the new `AWS::Logs::LogGroup` resource. Manually delete the auto-created log group once, then deploy.
