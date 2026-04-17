# CLAUDE.md — site/

Astro 4 static site. Landing page, blog, all demo frontends live here. Everything renders to static HTML at build time; React is only hydrated for the components that actually need interactivity (islands).

Day-to-day authoring (writing posts, adding demo pages, styling): see `../AUTHORING.md`. This file is for when you're editing the app itself.

## Mental model

- **Astro pages** under `src/pages/` map file paths → URLs.
- **Content collections** (`src/content/blog/`) are Zod-validated at build time.
- **Layout.astro** is the one shell every page goes through — owns `<html>`, SEO, nav, footer, skip-link.
- **SEO.astro** handles canonical, OG, Twitter, JSON-LD. Pages don't set those directly; they pass props through Layout.
- **React components** must use a `client:*` directive to ship any JS; otherwise they're SSR'd to static HTML and shipped inert.

## Pinned / fragile versions

| Package | Version | Why |
|---|---|---|
| `astro` | `^4.16.10` | Astro 4 line; 5 requires breaking changes across integrations |
| `@astrojs/sitemap` | `3.2.1` (exact) | 3.7+ uses Astro 5 hooks and breaks at build time |

Do not bump these without a planned Astro-5 migration task.

## Layout conventions

- Default: `max-w-3xl` main column. Landing/blog use this.
- Pass `wide={true}` to `Layout` for full-bleed pages (demos with WebGL, dashboards, large visualizations). Nav and footer stay centered even in wide mode.
- Skip-to-content link is always present, visible on keyboard focus only.
- Nav links to `/blogs` and `/demos` (the demos index), not to individual demos.

## Content schema (`src/content/config.ts`)

Minimal on purpose: `title`, `description`, `pubDate`, optional `updatedDate`, `draft`, `tags`, `ogImage`. Expand when a real post needs it, not preemptively.

Drafts are excluded from `getStaticPaths`, so they don't produce pages at all — no separate noindex handling needed.

## OG images

- Default: `site/public/og/default.png` (1200×630 static placeholder).
- `SITE.ogImageDefault` in `consts.ts` points at it.
- Per-page `ogImage` prop on `Layout` (or `ogImage` frontmatter on blog posts) overrides the default.
- Dynamic per-post OG generation via `astro-og-canvas` is installed but not wired up — tracked as future work.

## Scripts

| | |
|---|---|
| `pnpm --filter @jeffarnoldlabs/site dev` | local dev server |
| `pnpm --filter @jeffarnoldlabs/site build` | production build into `site/dist/` |
| `pnpm --filter @jeffarnoldlabs/site preview` | serve built output locally |
| `pnpm --filter @jeffarnoldlabs/site check` | `astro check` — TS + Astro validation. CI runs this before build |

## Things that would bite you

- `prose` classes depend on `@tailwindcss/typography` being registered in `tailwind.config.mjs`. If you refactor Tailwind config, keep the plugin.
- `build.format: 'directory'` + `trailingSlash: 'never'` is coupled to the CloudFront `CanonicalHostFunction`. Changing either requires updating the other.
- Blog frontmatter violations fail the build with a Zod error pointing to the file. This is intentional — don't soften the schema to paper over a typo.
