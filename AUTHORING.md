# Authoring Guide

How to add and style content on `jeffarnoldlabs.com` — landing page, blog posts, and demos. For repo layout, deploy model, and infra, see [`README.md`](./README.md). This guide is for the day-to-day "I want to write/change something" workflow.

## 1. Stack at a glance

| Piece | What it is | Where |
|---|---|---|
| Framework | **Astro 4**, static output (`output: 'static'`) | `site/astro.config.mjs` |
| Interactive islands | **React 18** via `@astrojs/react` | hydrate `.tsx` components in `.astro`/`.mdx` |
| Styling | **Tailwind CSS 3** (base styles applied) | `site/tailwind.config.mjs` |
| Content | **MDX** via Astro Content Collections with Zod schemas | `site/src/content/` |
| SEO | Canonical, OG, Twitter, JSON-LD baked into every page | `site/src/components/SEO.astro` |
| Feeds | Sitemap + RSS auto-generated | `/sitemap-index.xml`, `/rss.xml` |

Key principle: **Astro renders everything as static HTML at build time.** React only runs in the browser for the specific components you opt in to hydrate. That means heavy libraries (D3, Three.js, canvas) stay out of pages that don't need them.

## 2. Quick start

```bash
corepack enable          # first time only — activates pnpm 9
pnpm install
pnpm dev                 # astro dev on http://localhost:4321
pnpm build               # production build into site/dist/
pnpm preview             # serve the built site locally
```

Hot module reload is on. Edit any file under `site/src/` and the page updates.

## 3. Project map — where things live

```
site/src/
├── pages/                  # URL routing — one file per route
│   ├── index.astro         # "/" — landing page
│   ├── blogs/
│   │   ├── index.astro     # "/blogs" — post list
│   │   └── [...slug].astro # "/blogs/<slug>" — dynamic per-post page
│   ├── demos/
│   │   └── <name>/
│   │       └── index.astro # "/demos/<name>"
│   └── rss.xml.ts          # RSS endpoint
├── content/
│   ├── config.ts           # Zod schema for blog frontmatter
│   └── blog/               # One .md / .mdx file per post
├── components/             # Reusable .astro / .tsx components
│   └── SEO.astro
├── layouts/
│   └── Layout.astro        # Base HTML shell (nav, footer, SEO head)
└── consts.ts               # Site title, description, author, OG defaults
```

Anything in `site/public/` (e.g. `favicon.svg`, `robots.txt`) is served as-is at the root.

## 4. Editing the landing page

File: `site/src/pages/index.astro`.

The page currently lists recent blog posts with prose styling. You have three layers to play with:

1. **Markup & Tailwind classes** — edit inside the `<Layout>` block. Anything goes; use arbitrary values (`class="bg-[#0b0f1a]"`), responsive prefixes (`md:`, `lg:`), and group/peer interactions.
2. **Astro components** — drop new `.astro` files into `site/src/components/` and import them. They render at build time, zero JS shipped.
3. **React islands** — for stateful interactivity or animations that need JS, author a `.tsx` component and hydrate it (see §8).

### Swapping the layout shell

The nav, footer, and `<main>` wrapper come from `site/src/layouts/Layout.astro`. If the landing page needs a different frame (e.g. full-bleed hero with no max-width), either:

- Pass content outside `max-w-3xl` by cloning `Layout.astro` into a `LandingLayout.astro` variant, or
- Add a prop like `wide={true}` to `Layout.astro` and branch on it.

### Animation & polish ideas

The codebase has no opinion here yet — you can pick whatever you like. A few pairings that work well with Astro's static model:

- **CSS-only:** `@keyframes`, scroll-driven `animation-timeline`, Tailwind's `animate-*` utilities — no JS cost.
- **Framer Motion** or **Motion One** — drop as a React island (`client:load` or `client:visible`).
- **Canvas / WebGL:** `<canvas>` + a small `client:only="react"` component; prevents SSR rendering attempts for WebGL contexts.
- **D3** — same pattern; see §6.
- **Tilt/parallax micro-interactions:** `vanilla-tilt` or a small custom hook works fine as an island.

Install new deps inside the `site/` workspace: `pnpm --filter site add <pkg>`.

### Tailwind typography caveat

`index.astro` uses `prose prose-slate` classes, but **`@tailwindcss/typography` is not currently installed**. Those classes will silently no-op. If you want nice default styling on long-form text blocks, add it:

```bash
pnpm --filter site add -D @tailwindcss/typography
```

Then register it in `site/tailwind.config.mjs`:

```js
plugins: [require('@tailwindcss/typography')],
```

## 5. Adding a blog post

1. Create a new file under `site/src/content/blog/`. Name becomes the URL slug: `my-post.mdx` → `/blogs/my-post`.
2. Frontmatter must satisfy the Zod schema in `site/src/content/config.ts`:

   ```yaml
   ---
   title: "Post title"
   description: "One-sentence summary, shown on the index and in meta tags."
   pubDate: 2026-04-20            # required — build fails without it
   updatedDate: 2026-05-01        # optional
   draft: false                   # drafts are excluded from lists, RSS, sitemap
   tags: ["llm", "interpretability"]
   ogImage: "/og/my-post.png"     # optional — defaults to /og/default.png
   ---
   ```

3. Body is MDX — Markdown plus JSX. You can import components:

   ```mdx
   import Chart from '../../components/Chart.tsx';

   Here's an interactive chart:

   <Chart client:visible />
   ```

4. `.md` works too if you don't need JSX. The content collection picks both up.

The blog index (`/blogs`) and the landing page's "Recent posts" section read from the collection automatically — no registration step.

**Validation:** if frontmatter is malformed, `pnpm build` fails with a Zod error pointing to the file. `pnpm dev` surfaces the same error in the browser overlay.

## 6. Adding a demo page

Two flavors — pick based on whether the demo needs a server:

### (a) Frontend-only demo

Pure client-side interactivity (D3, a canvas sim, a React toy, a WASM widget). No AWS involved.

1. Create `site/src/pages/demos/<name>/index.astro`.
2. Use `Layout` for the shell (or a custom one if the demo wants full bleed).
3. Author interactive pieces as React components in `site/src/components/<name>/` and import them with a `client:*` directive (see §8).

Example shell:

```astro
---
import Layout from '../../../layouts/Layout.astro';
import Sim from '../../../components/my-demo/Sim.tsx';
---

<Layout title="My Demo — Jeff Arnold Labs" description="…">
  <h1 class="text-2xl font-semibold">My Demo</h1>
  <Sim client:only="react" />
</Layout>
```

**D3 tip:** D3 mutates the DOM directly, which fights React's reconciliation if you let it. Two working patterns:

- Render an empty `<svg ref={ref}>` from React; run all D3 inside `useEffect` targeting `ref.current`.
- Use D3 purely for scales/layouts (`d3-scale`, `d3-shape`) and emit SVG via React. Cleaner, easier to debug. `pnpm --filter site add d3 @types/d3`.

**Heavy libs (Three.js, CanvasKit, large WASM):** prefer `client:only="react"` — this skips Astro's SSR pass entirely, which avoids `window`/`document` errors at build time.

### (b) Full-stack demo (frontend + API)

If the demo needs a backend, there's a whole scaffolding pattern (SAM, API Gateway, Lambda, CloudFront cache behavior, SSM wiring). That lives in [`README.md` → "Adding a new demo"](./README.md#adding-a-new-demo). The frontend half is still just step (a) above — your page calls `/demos/<name>/api/*` and CloudFront routes it to the demo's API Gateway.

### Registering the demo in nav

`Layout.astro` currently hardcodes `/demos/memory-steering` as the Demos link. When you add new demos, either:

- Change the nav to point to a `/demos` index page that lists all of them, or
- Leave it pointed at a featured demo and rely on a demos index for discovery.

There is no demos index page yet — creating `site/src/pages/demos/index.astro` that lists available demos is a reasonable next step.

## 7. Design conventions

- **Max content width:** `max-w-3xl` in `Layout.astro`. Break out of it per-page when a demo/hero needs it.
- **Color palette:** currently just `bg-white` + `text-slate-900` + `text-slate-500` / `text-slate-700` accents. No design tokens file yet — if a palette solidifies, extract it into `tailwind.config.mjs` under `theme.extend.colors`.
- **Site metadata:** title / description / author / default OG image live in `site/src/consts.ts`. Change those once and they propagate to every page's `<head>`.
- **Every page uses `<Layout>`.** That's what guarantees SEO tags, canonical URLs, sitemap inclusion, and consistent chrome.

## 8. React islands & hydration directives

Astro's island model: by default nothing ships JS. You opt in per component with `client:*`:

| Directive | When to use |
|---|---|
| `client:load` | Hydrate immediately on page load. Use for above-the-fold interactivity. |
| `client:idle` | Hydrate when the browser is idle. Good for non-critical UI. |
| `client:visible` | Hydrate when the component scrolls into view. Good for demos below the fold. |
| `client:only="react"` | **Skip SSR entirely**, render only on client. Required for libs that touch `window` (Three.js, WebGL, CanvasKit). |
| `client:media="(min-width: 768px)"` | Conditional hydration by viewport. |

Inside `.mdx`, the same directives apply:

```mdx
import MyViz from '../../components/MyViz.tsx';

<MyViz client:visible data={[1,2,3]} />
```

Props must be JSON-serializable (they cross the SSR→client boundary).

## 9. Embedding interactive HTML demos

Self-contained `.html` files (D3 visualizations, canvas sims, exported notebook widgets) embed as iframes via `InteractiveEmbed` — a windowed frame with an "open in new tab" link for viewing the demo at full size.

### How it works

1. Drop the `.html` file into `site/public/blog/<slug>/`. Anything under `public/` ships as-is at the same path — e.g. `site/public/blog/my-post/viz_1.html` is served at `/blog/my-post/viz_1.html`. Do **not** put it under `site/src/content/blog/<slug>/` — Astro's content collection only serves `.md`/`.mdx` from there.

2. Import the component in the MDX and embed it:

   ```mdx
   import InteractiveEmbed from '../../components/InteractiveEmbed.astro';

   <InteractiveEmbed
     src="/blog/my-post/viz_1.html"
     title="3D embedding viewer"
     caption="Drag to rotate; hover for context; click to pin."
   />
   ```

### Props

| Prop | Default | Meaning |
|---|---|---|
| `src` | — (required) | Path to the HTML file under `/blog/<slug>/...`. |
| `title` | — (required) | Accessible title for the iframe (shows in screen readers, dev tools). |
| `height` | `"600px"` | CSS height for the embed window. Accepts any valid CSS length (`"80vh"`, `"800px"`, etc.). |
| `caption` | — | Optional caption shown below the frame, next to the "open in new tab" link. |

Add as many `<InteractiveEmbed>`s as the post needs — each one is an independent iframe. The HTML files can assume they own the full viewport; the embed constrains them to the frame.

## 10. Scroll-triggered text animations

Reusable React islands that decorate inline text when it crosses a configurable line in the viewport. They live under `site/src/components/animations/` and share one hook — `useScrollTrigger` — for scroll detection. Each specific effect is its own `.tsx` file so new effects can be added without touching the existing ones.

### Using an existing effect

Import into an MDX post and wrap the target text. Because it's a React island, it needs a `client:*` directive — `client:visible` is usually right.

Every effect accepts:

| Prop | Default | Meaning |
|---|---|---|
| `triggerAt` | `0.5` | Vertical fraction of viewport where the fire line sits. `0` = top edge, `0.5` = midpoint, `1` = bottom edge. |
| `repeat` | `false` | If `false` (default), the effect fires once per page load. If `true`, it replays every time the element re-crosses the fire line. |

#### `EmojiTextFlashAnimation` — emoji floats in above, text flashes a color

```mdx
import EmojiTextFlashAnimation from '../../components/animations/EmojiTextFlashAnimation.tsx';

<EmojiTextFlashAnimation client:visible emoji="💡" color="#ca8a04">
  "to be human is to come up with ideas"
</EmojiTextFlashAnimation>
```

Extra props: `emoji` (any string — e.g. `"💡"`, `"🔥"`, `"🦀"`), `color` (any CSS color; default `"#ca8a04"`).

#### `SequentialTextGlow` — 2–4 text segments glow in order, each in its own color

```mdx
import SequentialTextGlow, { GlowSegment } from '../../components/animations/SequentialTextGlow.tsx';

<SequentialTextGlow client:visible stepMs={450}>
  <GlowSegment color="#ef4444">First</GlowSegment>, then
  <GlowSegment color="#3b82f6"> second</GlowSegment>, and finally
  <GlowSegment color="#22c55e"> third</GlowSegment>.
</SequentialTextGlow>
```

Non-`GlowSegment` text between segments passes through unanimated. Extra prop: `stepMs` (stagger between segments in ms; default `400`).

#### `EmojiStretchBlur` — an emoji streaks and blurs horizontally across the phrase

```mdx
import EmojiStretchBlur from '../../components/animations/EmojiStretchBlur.tsx';

<EmojiStretchBlur client:visible emoji="🚂" direction="right">GO FAST!</EmojiStretchBlur>
```

Extra props: `emoji`, `direction` (`"right"` or `"left"`; default `"right"`). Emoji sits behind the text (`z-index: -1`) so the words stay readable.

#### `EmojiExpand` — an emoji balloons out from the text and fades

```mdx
import EmojiExpand from '../../components/animations/EmojiExpand.tsx';

<EmojiExpand client:visible emoji="💥" speed="fast">BOOM</EmojiExpand>
```

Extra props: `emoji`, `speed` (`"fast"` ≈ 0.7s, `"slow"` ≈ 1.8s; default `"fast"`).

### The shared hook

`useScrollTrigger<T extends HTMLElement>(options)` returns `{ ref, fireCount }`.

| Option | Default | Meaning |
|---|---|---|
| `triggerAt` | `0.5` | Vertical fraction of viewport (0–1) where the fire line sits. |
| `once` | `false` | If `true`, `fireCount` increments at most once per page load. |

`fireCount` is a monotonic counter — it increments each time the element crosses the fire line from outside the zone. Use it to `key` decorative elements (so their CSS animations replay cleanly on each re-fire) and to run animation-restart effects on the stable content element.

### Building a new effect

Three steps:

1. **Add keyframes + animation** to `site/tailwind.config.mjs` under `theme.extend`. Add `forwards` to the animation shorthand if the end state should be retained (see gotcha below).

   ```js
   keyframes: {
     'sparkle-pop': {
       '0%':   { opacity: '0', transform: 'scale(0.5)' },
       '50%':  { opacity: '1', transform: 'scale(1.2)' },
       '100%': { opacity: '0', transform: 'scale(1.0)' },
     },
   },
   animation: {
     'sparkle-pop': 'sparkle-pop 0.8s ease-out forwards',
   },
   ```

2. **Create a component** in `site/src/components/animations/<YourEffect>.tsx`. Use the shared hook and follow the `EmojiTextFlashAnimation` shape — stable ref'd children span, plus keyed decorations:

   ```tsx
   import { useEffect, useRef, type ReactNode } from 'react';
   import { useScrollTrigger } from './useScrollTrigger';

   type Props = { children: ReactNode; triggerAt?: number };

   export default function SparklePop({ children, triggerAt }: Props) {
     const { ref, fireCount } = useScrollTrigger<HTMLSpanElement>({ triggerAt });
     const textRef = useRef<HTMLSpanElement>(null);

     useEffect(() => {
       if (fireCount === 0) return;
       const el = textRef.current;
       if (!el) return;
       el.classList.remove('animate-sparkle-text');
       void el.offsetWidth;
       el.classList.add('animate-sparkle-text');
     }, [fireCount]);

     return (
       <span ref={ref} className="relative inline-block">
         {fireCount > 0 && (
           <span key={`s-${fireCount}`} aria-hidden="true" className="pointer-events-none absolute -top-5 left-1/2 animate-sparkle-pop">
             ✨
           </span>
         )}
         <span ref={textRef}>{children}</span>
       </span>
     );
   }
   ```

3. **Import and use in MDX** with a `client:*` directive, like the effects above.

### Gotchas (learned the hard way)

- **Never put `{children}` inside an element whose `key` changes.** MDX children are delivered via Astro's island slot mechanism and don't survive React remounts. Keep the element containing `{children}` stable (no `key`); use the reflow trick (`remove class` → `void el.offsetWidth` → `add class`) to replay its animation. Decorative elements with literal contents (an emoji, an SVG) *can* safely be keyed on `fireCount`.
- **Use `animation-fill-mode: forwards` when the end state matters.** Without it, CSS animations snap back to the element's natural pre-animation style when they finish — so a keyframe ending at `opacity: 0` reverts to `opacity: 1` once the animation completes. Add `forwards` to the animation shorthand in `tailwind.config.mjs`.
- **Island props must be JSON-serializable** (see §8). Numbers, strings, booleans, plain objects — fine. Functions, refs, class instances — no.
- **`client:visible` is fine for viewport-midpoint triggers.** The component hydrates as it enters the viewport, which is before it crosses the midpoint — the IntersectionObserver is ready in time.

## 11. SEO, feeds, and OG images

- **Per-page metadata:** pass `title`, `description`, optional `ogImage`, optional `tags` to `<Layout>`. Blog posts do this automatically from frontmatter.
- **Sitemap:** auto-built by `@astrojs/sitemap` at `/sitemap-index.xml`. Includes every generated route.
- **RSS:** `site/src/pages/rss.xml.ts` emits a feed of non-draft blog posts.
- **OG images:** `astro-og-canvas` is installed but not wired up yet. A generation pipeline is on the TODO list in the initial work history; for now, ship a static image under `site/public/og/` and reference it via the `ogImage` frontmatter field (or `ogImage` prop to `<Layout>`).

## 12. Gotchas & constraints

- **Pinned `@astrojs/sitemap@3.2.1`.** Newer versions (3.7+) require Astro 5. Don't bump until Astro itself is upgraded.
- **`trailingSlash: 'never'` + `build.format: 'directory'`.** URLs are `/blogs/hello-world` (no trailing slash), but the build emits `blogs/hello-world/index.html`. CloudFront has a function that maps one to the other — don't change either setting independently.
- **Strict TypeScript.** `tsconfig.json` extends `astro/tsconfigs/strict`. No implicit `any`.
- **Assets under `_astro/`.** Anything imported or referenced from Astro ends up there with a content hash and a 1-year immutable cache. Anything under `public/` ships as-is at its own path — good for `robots.txt`, favicons, OG images, etc.
- **MDX over `.md` for interactivity.** Plain `.md` can't import components; `.mdx` can. Use `.mdx` if you expect ever to embed a component.
- **Node 20 target.** `.nvmrc` says 20. Local dev on 18 currently works but CI builds on 20.

## 13. Deploy flow (quick summary)

- Push to `main` with changes under `site/**` → GitHub Actions builds Astro, syncs to S3, invalidates CloudFront. See `.github/workflows/site.yml`.
- Demo backend changes (`demos/<name>/backend/**`) and infra changes (`infra/**`) have their own workflows — unrelated to content authoring.

## 14. Common recipes

- **Change the site title** → `site/src/consts.ts`.
- **Add a nav link** → `site/src/layouts/Layout.astro` (the `<nav>` block).
- **Add a footer link** → same file, `<footer>`.
- **Draft a post** → set `draft: true` in frontmatter; it stays out of lists/feeds but renders at its URL for preview.
- **Preview locally before deploy** → `pnpm build && pnpm preview`.
- **Add a favicon variant** → drop into `site/public/`, add a `<link>` in `Layout.astro`.
- **New reusable component used across pages** → `site/src/components/Foo.astro` (no JS) or `Foo.tsx` (React island).
