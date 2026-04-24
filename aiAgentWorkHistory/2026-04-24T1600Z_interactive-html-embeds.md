# Interactive HTML embeds in blog posts

**Date:** 2026-04-24
**Agent:** Claude Opus 4.7 (Claude Code CLI)
**Task source:** `aiAgentProjectTasks/completed/2026-04-22T1540Z_add_interactive_html_file_to_blog_post.md`
**Status:** Complete (committed; infra change committed but not yet deployed)

---

## Summary

Built a reusable `InteractiveEmbed` component so self-contained interactive HTML files (three.js scenes, D3 widgets, exported notebook UIs) can be dropped into blog posts as framed "windows into the page" with a clear affordance distinguishing them from static screenshots. Wired it into the first real blog post (`latent-space-steering-part-1`) for two 3D embedding viewers, and along the way installed `three`/`@types/three`, fixed a CloudFront response-headers policy that was blocking same-origin iframes in production, and added a small `Collapsible` component for the two reference sections at the end of the post.

The pattern decided on: HTML files live in `site/public/blog/<slug>/` (served as-is by Astro); MDX imports `InteractiveEmbed` and points `src` at the path. No build-time copying or asset pipeline — the simplest thing that works.

## Changes by phase

### Phase 1 — Component + scaffolding

Read `AUTHORING.md`, `site/CLAUDE.md`, and the existing `template.mdx` / `latent-space-steering-part-1.mdx` to confirm the iframe pattern was already half-established (template post had a raw `<iframe>` tag pointing at `site/public/blog/template/template-example-embedded-page.html`). Decided to keep that file-layout convention and extract a component around it.

Built `site/src/components/InteractiveEmbed.astro`:

- Props: `src`, `title`, optional `height` (default `600px`), optional `caption`.
- Renders a rounded `figure` with `overflow-hidden`, a lazy-loaded `<iframe>` filling the frame, and a `<figcaption>` below that pairs the caption text with a right-aligned "Open in new tab ↗" affordance so readers can pop the viz into its own tab at full size.
- `loading="lazy"` so iframes below the fold don't initialize until scrolled near — important because the viz is three.js + WebGL.

Moved the user's `blog_viz_1.html` from `site/src/content/blog/latent-space-steering-part-1/` into `site/public/blog/latent-space-steering-part-1/` (Astro only serves static files from `public/`; files in `src/content/` only surface through the collection's `.md`/`.mdx` routing). Updated the post's MDX to embed it via `<InteractiveEmbed>`, replacing the placeholder iframe.

### Phase 2 — Vite choking on `three` imports

Ran `pnpm dev` to verify, and Vite's dependency optimizer threw `three` / `three/addons/controls/OrbitControls.js` resolution errors — triggered by a stale copy of `blog_viz_1.html` the user had re-added under `src/content/blog/...`, which Vite was trying to process because it sat inside the content root.

The HTML has a browser `importmap` pointing `three` at the unpkg CDN, so it works at runtime in the iframe — but Vite doesn't see importmaps and was resolving bare `three` against `node_modules`. Installed `three` + `@types/three` in the site workspace to satisfy the optimizer. Dev server now boots cleanly.

Left the duplicate HTML in `src/content/` untouched pending user direction — flagged to the user rather than auto-deleting, since the two copies had diverged.

### Phase 3 — Corner badge for affordance

Shipped, then talked through a design question: the user was considering converting every static image in the post into an `InteractiveEmbed` purely to make "this is interactive" obvious. Pushed back with a rough performance analysis — each three.js iframe is a full WebGL context with its own rAF loop and ~30–80 MB heap; 10 of them approaches the browser's ~16-context cap and kills mid-range mobile. Recommended solving the affordance problem directly instead.

Added a small **"● Interactive"** pill in the top-left corner of every embed:

- Semi-transparent dark background with `backdrop-blur-sm` so it reads cleanly on both dark-bg and light-bg iframe content.
- `pointer-events-none` so it never swallows clicks/drags on the viz.
- `aria-hidden="true"` — decorative; screen readers rely on the iframe's `title` prop.
- A tiny emerald-400 dot next to the label, borrowing the "live status" idiom used by streaming/broadcast UIs.

Also tweaked the captions on both `InteractiveEmbed` usages in the post to lead with action verbs ("Drag to rotate • hover for context • click to pin") so skim-readers pick up the affordance from the caption text too.

### Phase 4 — Production iframe blocked by X-Frame-Options

User deployed the site via `./scripts/deploy-site.sh jal-infra` (local AWS creds path — no GitHub OIDC set up yet) and reported the iframes rendering as broken-file icons in prod.

Root cause: `infra/template.yaml`'s `SiteResponseHeadersPolicy` was emitting `X-Frame-Options: DENY` on every static-site response. `DENY` blocks framing from any origin — including same-origin — so the browser refused to render `blog_viz_1.html` inside the blog page.

Changed `FrameOption: DENY` → `FrameOption: SAMEORIGIN`. This still blocks third-party sites from framing `jeffarnoldlabs.com` content (the actual security purpose of the header) while allowing the blog page to iframe its own `/blog/<slug>/*.html` files. Updated `infra/CLAUDE.md`'s resource-table line to match.

Infra change requires `sam deploy` — `deploy-site.sh` only syncs S3 content and doesn't touch CloudFormation. Left the infra deploy to the user since `samconfig.toml` in the infra dir is wired for their local creds.

### Phase 5 — Collapsible sections

Separate UX ask: the user wanted "Loose Ends" and "Alternatives" at the end of the post to be collapsed by default, showing just the heading. Built `site/src/components/Collapsible.astro` around the native `<details>` / `<summary>` element — zero JS, keyboard-accessible by default, anchor-linkable, and styled to match the `##` heading level (`text-2xl font-semibold`). A ▾ chevron in the top-right rotates 180° when open via `group-open:rotate-180`.

Wrapped both sections in the post. Kept "Final Thoughts" as a regular `##` heading since that's the closing beat.

## Decisions worth recording

- **HTML files live in `public/`, not `src/content/`.** Astro's content collection only routes `.md`/`.mdx` files; `.html` in `src/content/` just sits there unused, and if Vite finds it during dev it'll try to resolve any bare imports it sees (the `three` error in Phase 2). Canonical location for embeddable HTML is `site/public/blog/<slug>/*.html`, served as-is at `/blog/<slug>/*.html`.
- **Don't solve affordance with iframes.** Converting static screenshots into iframes just to make them "look interactive" pays a massive CPU/memory/battery cost per viewer for zero interactivity gain. Solve affordance in the frame chrome instead (the corner badge + verb-led caption). `<Image>` stays the right tool for static screenshots even when those screenshots happen to depict an interactive scene.
- **`X-Frame-Options: SAMEORIGIN` not `DENY`.** `DENY` precludes any same-origin embedding, which kills the interactive-embed pattern. `SAMEORIGIN` preserves the clickjacking protection (third-party sites still can't frame jeffarnoldlabs.com) while letting the site iframe itself.
- **`<details>` over a custom disclosure component.** Native element = zero JS, better a11y out of the box, anchor-link-into-collapsed-section works for free in modern browsers. The wrapper component is just for consistent `##`-matching typography.
- **Three.js resolved locally even though the iframe uses a CDN importmap.** Installed purely to silence Vite's dep scan of any `.html` file it accidentally finds in the content root. Runtime still loads three from unpkg via the importmap in each `blog_viz_*.html`, so the CDN copy gets cached once across all iframes on the page.

## Verification performed

- `pnpm --filter @jeffarnoldlabs/site check` — 0 errors / 0 warnings.
- `pnpm --filter @jeffarnoldlabs/site build` — static build succeeds; 6 pages generated; all four blog images continue to optimize into `_astro/*.webp`.
- Dev server boot after `three` install — clean, no Vite dep errors.
- `curl` checks on the dev server — `/blogs/latent-space-steering-part-1` returns 200, `/blog/latent-space-steering-part-1/blog_viz_1.html` returns 200, and the built page's iframe `src` points at the right path.

Not performed:
- Live browser check of the deployed site with the new `X-Frame-Options: SAMEORIGIN` header — infra hasn't been `sam deploy`'d yet as of this commit. User will deploy separately and verify.
- Mobile / low-end device testing of the two-iframe page. The lazy-load + CDN-shared three.js should keep it in good shape, but not empirically confirmed.

## Out of scope (intentional, not gaps)

- Deduping the `blog_viz_1.html` copies (one in `src/content/`, one in `public/`). Flagged to the user mid-session; left for them to resolve since their copies had diverged and either could be the intended source of truth.
- A build-step that auto-copies `.html` files from `src/content/blog/<slug>/` to `public/blog/<slug>/`. Would remove the "put the HTML file in public/" foot-gun, but adds build machinery for a problem a one-line convention fixes just as well.
- Converting any of the static `<Image>` uses in the post to iframes. Explicitly decided against (see "Decisions worth recording").
- Running `sam deploy` for the infra change. User handles infra deploys; I only committed the template change.

## Files changed

**New:**
- `site/src/components/InteractiveEmbed.astro` — framed iframe with corner "Interactive" badge, caption, and "Open in new tab" link.
- `site/src/components/Collapsible.astro` — styled wrapper around native `<details>` / `<summary>`.
- `site/public/blog/latent-space-steering-part-1/blog_viz_1.html` — first 3D viz, moved from `src/content/`.
- `site/public/blog/latent-space-steering-part-1/blog_viz_2.html` — second 3D viz (self-actualization steering), added by the user during the session.
- Co-located image/gif assets under `site/src/content/blog/latent-space-steering-part-1/` (firstClustering, secondClusteringImageWIdeas, alpha2/5/10/20/200, OriginalPreDream, fearAndUncertainty, joyAndCandy, transitionsThroughHigherAlphas).
- `aiAgentWorkHistory/2026-04-24T1600Z_interactive-html-embeds.md` (this file).

**Modified:**
- `site/src/content/blog/latent-space-steering-part-1.mdx` — replaced placeholder iframe with two `<InteractiveEmbed>` usages, wrapped "Loose Ends" and "Alternatives" in `<Collapsible>`, general post-content rewrites by the user.
- `site/src/content/blog/template.mdx` — scaffold now demonstrates `<InteractiveEmbed>` instead of a raw iframe tag.
- `AUTHORING.md` — new §9 "Embedding interactive HTML demos" with the `public/blog/<slug>/` convention, component prop table, and MDX usage example; downstream section numbers bumped.
- `infra/template.yaml` — `FrameOption: DENY` → `SAMEORIGIN`.
- `infra/CLAUDE.md` — updated the `SiteResponseHeadersPolicy` row to reflect the new header value.
- `site/package.json` — added `three` (dep) and `@types/three` (devDep).
- `pnpm-lock.yaml` — corresponding lockfile entries.

**Moved:**
- `aiAgentProjectTasks/2026-04-22T1540Z_add_interactive_html_file_to_blog_post.md` → `aiAgentProjectTasks/completed/`
