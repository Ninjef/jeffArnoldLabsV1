# Blog Authoring Workflow + /newPost Skill

**Date:** 2026-04-17
**Agent:** Claude Opus 4.7 (Claude Code CLI)
**Task source:** `aiAgentProjectTasks/completed/2026-04-17T1600Z_BLOG_AUTHORING_WORKFLOW.md`
**Status:** Complete (changes staged in working tree; not yet committed or deployed)

---

## Summary

Walked through end-to-end blog post authoring using `hello-world.mdx` as a live sandbox — added an image, a GIF, and an iframed interactive HTML page, establishing conventions for each. Along the way: fixed a lazy-loading perf hit on above-the-fold images, installed `sharp` (previously missing), and hardened the post template. Finished by creating a `/newPost` Claude Code skill that scaffolds a new post from `template.mdx` in one turn.

User decisions captured along the way:
- **Asset placement**: co-locate per-post assets next to the `.mdx` (under `site/src/content/blog/<slug>/`) rather than centralizing under `src/assets/`.
- **Iframe page naming**: use a slug-prefixed filename (`<slug>-example-embedded-page.html`) so the `public/blog/<slug>/` folder is unambiguous per-post.
- **Skill scope**: minimal — ask title/description/gist, derive slug and tags, scaffold files; do not run build, do not open the post in an editor.

---

## Changes by phase

### Phase 1 — Inline image (above the fold)

Added an optimized image to `hello-world.mdx` via `astro:assets`, co-located at `site/src/content/blog/hello-world/usage-limits.png`. Imported and rendered via `<Image>`:

```mdx
import { Image } from 'astro:assets';
import usageLimits from './hello-world/usage-limits.png';

<Image src={usageLimits} alt="…" loading="eager" fetchpriority="high" class="rounded border border-slate-200" />
```

- Initial attempt placed the image at `site/src/assets/blog/hello-world/`; switched to co-location per user preference. Removed the now-empty `src/assets/` tree.
- First build failed with `[CouldNotTransformImage] Could not find Sharp`. Installed `sharp` as a devDependency of `@jeffarnoldlabs/site`. Optimizer now converts 113 kB PNG → 24 kB WebP at build time.
- After the first preview, Astro flagged the image as above-the-fold with `loading="lazy"` (the default). Added `loading="eager"` + `fetchpriority="high"` to bump it in the browser's request queue so it doesn't get deprioritized behind CSS/JS.

### Phase 2 — Inline GIF (animated)

Added `giphy.gif` co-located at `site/src/content/blog/hello-world/giphy.gif`.

Key wrinkle: `astro:assets`'s `<Image>` component re-encodes images to WebP, which drops GIF animation. Solution is to import the GIF and reference `.src` in a plain `<img>` tag — the import still gets content-hashed and served under `/_astro/`, but no transform runs:

```mdx
import giphy from './hello-world/giphy.gif';
<img src={giphy.src} alt="…" class="rounded border border-slate-200" />
```

### Phase 3 — Embedded interactive HTML

User dropped a 170 kB self-contained HTML page (`compare.html`) inside `site/src/content/blog/hello-world/`. Files under `src/content/` are not served as static assets — only `public/` is. Moved it to `site/public/blog/hello-world/` and embedded with an iframe:

```mdx
<iframe
  src="/blog/hello-world/hello-world-example-embedded-page.html"
  title="Run comparison"
  loading="lazy"
  class="w-full rounded border border-slate-200"
  style="height: 600px;"
/>
```

The user then renamed the file in-IDE to make its post scoping explicit (`<slug>-example-embedded-page.html`); this naming convention is now codified in the `/newPost` skill.

Flagged but not resolved this session: the blog post template (`site/src/pages/blogs/[...slug].astro`) renders inside `Layout`'s `max-w-3xl` column, which can feel cramped for interactive demos. A future frontmatter flag (`wide: true` → `<Layout wide>`) is a reasonable follow-up. Not needed for the placeholder post.

### Phase 4 — Template hardening

The user created `site/src/content/blog/template.mdx` plus co-located asset folders (`site/src/content/blog/template/` and `site/public/blog/template/`) to serve as the scaffolding source. Two bugs in the template:

1. **Stale imports**: `template.mdx` imported from `./hello-world/...` (leftover from duplicating the hello-world post). Fixed to `./template/...` so the template is self-consistent and the skill can do a clean `template` → `<slug>` replacement.
2. **`draft: false`**: the template would have published at `/blogs/template`. Flipped to `draft: true` so it's excluded from lists, RSS, sitemap, and `getStaticPaths`, but still renders at the URL for local inspection if needed.

### Phase 5 — `/newPost` skill

Created `.claude/skills/newPost/SKILL.md`. Invocation flow:

1. `AskUserQuestion` collects title, description, gist in one prompt.
2. Agent derives: slug (kebab-case from title), tags (2–4 keywords from gist), `pubDate` (today).
3. Confirms derived slug with user before proceeding.
4. Copies:
   - `site/src/content/blog/template.mdx` → `site/src/content/blog/<slug>.mdx`
   - `site/src/content/blog/template/` → `site/src/content/blog/<slug>/` (images)
   - `site/public/blog/template/` → `site/public/blog/<slug>/` (iframe HTML)
   - Renames the example HTML: `template-example-embedded-page.html` → `<slug>-example-embedded-page.html`.
5. Rewrites `<slug>.mdx` via targeted Edits:
   - Frontmatter: `title`, `description`, `pubDate`, `draft: false`, `tags`.
   - Import paths: `./template/*` → `./<slug>/*`.
   - Iframe src: `/blog/template/template-example-embedded-page.html` → `/blog/<slug>/<slug>-example-embedded-page.html`.
6. Skill does not run a build — the template is known-working and the diff is mechanical.
7. Skill stops and asks for a different slug if `<slug>.mdx` or either `<slug>/` folder already exists.

---

## Decisions worth recording

- **Co-located assets under the content collection folder** (e.g. `site/src/content/blog/<slug>/image.png`), not a centralized `src/assets/blog/` tree. Keeps per-post assets discoverable and deletable with the post. Astro's content-collection scanner only picks up `.md` / `.mdx` files, so non-content files in the same folder don't affect collection behavior.
- **`astro:assets` for static images, plain `<img>` imports for GIFs.** One rule, two render paths, both hashed and cached identically by CloudFront's `/_astro/*` behavior.
- **Iframed interactive HTML lives under `public/blog/<slug>/`** with a slug-prefixed filename. This keeps the page URL self-documenting (`/blog/<slug>/<slug>-example-embedded-page.html`) and avoids collisions if a future post also wants a `compare.html`.
- **Template `draft: true`.** The template is a developer artifact, not a post. Any new post created via the skill explicitly flips this to `false`.
- **Skill doesn't run the build.** Scaffolding operates on a known-good template and only does mechanical find-replace. Running `pnpm build` per invocation would add ~2s to every `/newPost` for no real signal.

---

## Verification performed

- `pnpm --filter @jeffarnoldlabs/site build` — passes at each phase:
  - After image add + sharp install: 6 pages, optimized image 113 kB → 24 kB WebP.
  - After GIF add: no regression, GIF served as-is under `/_astro/` with content hash.
  - After iframe add: no regression, HTML served from `/blog/hello-world/...` via the default cache behavior.
  - After template fixes: clean build.
- Skill was not executed during this session (would need a fresh `/newPost` invocation to fire). Logic was reviewed statically against the schema.

Not yet performed:
- End-to-end `/newPost` invocation creating a real second post.
- Live deploy. No CI was triggered.

---

## Out of scope (intentional, not gaps)

- **`wide` frontmatter flag** for full-bleed posts. Flagged to the user; not needed until a real post outgrows the `max-w-3xl` column.
- **Iframe resize handshake.** `postMessage`-based auto-sizing would be nice for variable-height interactive pages, but a hardcoded `height: 600px` is enough for now.
- **Documentation update**: `AUTHORING.md` still doesn't cover images / GIFs / iframes explicitly. The patterns are now live in `hello-world.mdx` and in the template, but a dedicated section in `AUTHORING.md` is a reasonable follow-up.
- **Permissions / settings updates**: user considered adding the skill's common bash commands (`cp`, `mv`, `mkdir`) to `.claude/settings.local.json` but interrupted before any change landed. No settings files modified.

---

## Files changed

**New:**
- `.claude/skills/newPost/SKILL.md`
- `site/src/content/blog/hello-world/usage-limits.png`
- `site/src/content/blog/hello-world/giphy.gif`
- `site/public/blog/hello-world/hello-world-example-embedded-page.html` (renamed by user from `compare.html`)
- `site/src/content/blog/template.mdx` (created by user during session)
- `site/src/content/blog/template/usage-limits.png` (created by user during session)
- `site/src/content/blog/template/giphy.gif` (created by user during session)
- `site/public/blog/template/template-example-embedded-page.html` (created by user during session)

**Modified:**
- `site/src/content/blog/hello-world.mdx` (image + GIF + iframe embeds, eager loading, fetchpriority)
- `site/src/content/blog/template.mdx` (fixed stale imports; flipped `draft` to `true`)
- `site/package.json` + `pnpm-lock.yaml` (added `sharp` devDependency)

**Moved:**
- `site/src/content/blog/hello-world/compare.html` → `site/public/blog/hello-world/compare.html` (before the user renamed it to `hello-world-example-embedded-page.html`)
