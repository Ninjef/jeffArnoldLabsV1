# More Scroll-Triggered Text Animations

**Date:** 2026-04-19
**Agent:** Claude Opus 4.7 (Claude Code CLI)
**Task source:** `aiAgentProjectTasks/completed/2026-04-17T1704Z_MORE_ANIMATIONS.md`
**Status:** Complete (committed; not yet deployed)

---

## Summary

Extended the scroll-triggered animation catalog started in the previous session. The existing `LightbulbIdea` component hard-coded the emoji and glow color into its keyframes; the task was to generalize it into a color-/icon-parameterized component and add three new distinct effects. One additional effect (a full-screen lightning strike anchored to a heading) was added during the session at the user's request.

Delivered five animation components, all following the same `useScrollTrigger` + Tailwind keyframe pattern, all now defaulting to fire-once with a `repeat` prop to opt back into re-triggering:

- **`EmojiTextFlashAnimation`** — generic replacement for `LightbulbIdea`. Takes an `emoji` (any string) and a `color` (any CSS color). Text flashes the given color via a shared CSS-variable-driven keyframe.
- **`SequentialTextGlow`** + **`GlowSegment`** — 2–4 text segments glow in sequence, each in its own color, with non-animated text allowed between them.
- **`EmojiStretchBlur`** — an emoji stretches and blurs horizontally across a phrase (configurable direction).
- **`EmojiExpand`** — an emoji balloons out from the text and fades (fast/slow variants).
- **`LightningStrike`** — a full-screen white flash plus a jagged SVG lightning bolt drawn horizontally across the title's y-coordinate, anchored to document position so it scrolls with the page.

## Architecture

Stayed with the established one-file-per-effect pattern sharing `useScrollTrigger`. Two cross-cutting refinements:

- **CSS-custom-property-driven colors.** Generic keyframes reference `var(--flash-color)`; components set that var inline. One keyframe serves any color.
- **`repeat` prop (default `false`).** All five components fire once per page load by default; set `repeat` to re-trigger on every re-crossing of the fire line. This is an API break vs. the previous `stays` prop (which conflated "once" with "decoration-persists-visually"). Decoupled.

## Changes by phase

### Phase 1 — Plan + generalization

Planned in detail before writing code. Key scope decisions recorded in the plan file at `~/.claude/plans/i-d-like-you-to-noble-pond.md`:

- Delete `LightbulbIdea.tsx` rather than keep a shim. Updated the one MDX usage in the only existing post.
- CSS vars for color; single keyframe per visual class.
- For `SequentialTextGlow`, started with a React `Children.map`/`cloneElement` child-registration approach.

Implemented four generic components, updated `site/tailwind.config.mjs` to replace `idea-glow`/`bulb-float`/`bulb-float-stay` with color-agnostic `text-flash`/`sequence-glow`/`emoji-float`/`emoji-stretch-blur`(+ `-left`)/`emoji-expand`.

### Phase 2 — Sequential glow: Astro island child detection

First implementation of `SequentialTextGlow` used `Children.map` + `child.type === GlowSegment` in the parent to detect segments and inject an index via `cloneElement`. Didn't fire in the browser.

Root cause: when an Astro React island receives children from MDX, the children are delivered as server-pre-rendered HTML via Astro's slot mechanism — not as React element instances on the client. So `child.type === GlowSegment` never matched anything.

Fix: switched to a DOM-query approach. `GlowSegment` renders a plain `<span data-glow-segment style={{ --flash-color: color }}>…</span>` (no hydration of its own, just server-rendered HTML). `SequentialTextGlow` queries `[data-glow-segment]` within its own `ref` on fire, assigns `animation-delay: i * stepMs`, and applies the glow class via the reflow trick.

Verified by grepping the built `dist/.../index.html` for `data-glow-segment` and confirming all three segments rendered with the right inline colors.

### Phase 3 — `EmojiStretchBlur` tuning

First pass looked cool but was too dim and faded too quickly at 1.6s. Adjusted the keyframe:
- Peak opacity bumped from 0.9 to 1.0.
- Opacity held flat across 15%–60% of the run (was decaying from 25%).
- Duration extended 1.6s → 2.4s.

### Phase 4 — `LightningStrike` (added mid-session)

User asked whether a full-screen lightning strike anchored to the "The Spark" heading was feasible. Designed and built it:

- Pure CSS/SVG, no new deps. Two SVG paths (main bolt + small branch), `pathLength="1"` with `stroke-dasharray: 1; stroke-dashoffset: 1 → 0` for the draw-in. Three layered `drop-shadow` filters for the glow halo.
- Full-viewport white flash peaks at ~19% of the 1.6s run for the "lightning illuminates everything" feel.
- Hardcoded fire-once initially (user's preference); later refactored into the common `repeat` prop.
- **`createPortal(…, document.body)`** — escapes any ancestor `transform`/`filter`/`will-change` stacking context, which would otherwise cage `position: fixed`.

Two iterations on positioning:

1. First version positioned the bolt vertically (top-to-bottom), which didn't visually associate with the heading text. Switched to a horizontal strike at the heading's y-coordinate by reading `ref.current.getBoundingClientRect()` on fire and passing `strikeY` to the overlay. The bolt band is 400px tall centered on `strikeY`, `viewBox="0 0 1000 400"`, `preserveAspectRatio="none"` to stretch across the viewport.
2. First horizontal version used `position: fixed` for both the flash and the bolt. User pointed out the bolt stayed locked to the viewport instead of scrolling with the page. Fixed by capturing `rect.top + window.scrollY` (document y) and switching the bolt band to `position: absolute` on body. The flash stayed `fixed` — it's brief (~400ms), and a screen-wide illumination feels disconnected if it scrolls with the page.

### Phase 5 — `repeat` prop replaces `stays`

User asked to flip the default: fire once by default, with a boolean to opt into re-firing. Renamed `stays` → `repeat` across all five components, inverted the semantic (`once: !repeat`), and updated AUTHORING.md.

One follow-up bug: for `EmojiTextFlashAnimation`, the old `stays=true` branch used a "float-in-and-hold" keyframe (`emoji-float-stay`), which meant the new fire-once default left the emoji permanently visible above the text. User flagged it. Decoupled the two concerns: the emoji now always uses the float-in-and-out keyframe regardless of `repeat`, and the `emoji-float-stay` keyframe/animation was dropped from Tailwind config as dead code.

### Phase 6 — Applied the new effects to the existing blog post

Added usages of each new effect in `site/src/content/blog/latent-space-steering-part-1.mdx` as the session progressed:

- `EmojiTextFlashAnimation` — 💡 on the Dr. Barsawme quote (replacing the previous `LightbulbIdea` call; rendered output identical with `color="#ca8a04"`).
- `SequentialTextGlow` — three segments (green `matter`, blue `energy`, golden `same thing`) in the Einstein quote.
- `LightningStrike` — wrapping "The Spark" H2.
- `EmojiExpand` — 💥 on "OMG" in the AI-pinging-you example.

Caught one user mistake: a duplicate `triggerAt` prop on the `EmojiExpand` call (`triggerAt={0.2} … triggerAt={0.4}`). In JSX the last duplicate wins, silently overriding the intended value.

## Decisions worth recording

- **CSS custom properties beat keyframe-per-color.** A single keyframe referencing `var(--flash-color)` serves any color; the component writes the var inline.
- **DOM `querySelectorAll` beats React child-walking for Astro island children.** Children crossing the island boundary are pre-rendered HTML on the client, not React element trees — `Children.map`/`child.type` checks don't find them. Mark children with a `data-*` attribute and query the DOM from the parent's `ref` on fire instead.
- **`createPortal` to `document.body` for overlay effects.** Any ancestor with `transform`/`filter`/`will-change`/`perspective` creates a containing block that captures `position: fixed`. Portaling out avoids a whole class of "works in isolation, broken in context" bugs.
- **Viewport-anchored vs. document-anchored matters for animations that outlive the fire moment.** `position: fixed` is right for a sub-second flash; `position: absolute` at `rect.top + scrollY` is right for anything that persists long enough that the user might scroll during the animation.
- **`repeat` instead of `stays`.** The old name bundled "fires once" with "decoration persists visually". Those are separate concerns. `repeat` means only "replays on re-cross"; visual end state is the keyframe's job (with `animation-fill-mode: forwards` if the end state matters).
- **Duplicate JSX attributes fail silently.** Last wins. Worth remembering when props don't seem to honor.

## Verification performed

- `pnpm --filter @jeffarnoldlabs/site check` — 0 errors, 0 warnings across 19 files.
- `pnpm --filter @jeffarnoldlabs/site build` — static build succeeds; 6 pages generated.
- User manually verified each effect in the dev server (dev-loop iterations drove the tuning passes above).

Not performed:
- Live deploy.
- `prefers-reduced-motion` audit. The full-screen lightning flash is the most aggressive effect; accessibility polish deferred, consistent with the earlier `LightbulbIdea` work.

## Out of scope (intentional, not gaps)

- `prefers-reduced-motion` handling. User explicitly chose to leave consistent with existing effects and update globally later.
- A catch-all `<ScrollAnim variant="…">` component. The one-file-per-effect pattern is working; new effects can keep being additive.
- Animation pausing or cancellation on fast scroll.
- Per-segment emoji decorations in `SequentialTextGlow`. Kept pure text-glow to keep it distinct from `EmojiTextFlashAnimation`.

## Files changed

**New:**
- `site/src/components/animations/EmojiTextFlashAnimation.tsx`
- `site/src/components/animations/SequentialTextGlow.tsx`
- `site/src/components/animations/EmojiStretchBlur.tsx`
- `site/src/components/animations/EmojiExpand.tsx`
- `site/src/components/animations/LightningStrike.tsx`
- `aiAgentWorkHistory/2026-04-19T0000Z_more-animations.md` (this file)
- `.claude/skills/completeTask/SKILL.md` (new `/completeTask` workflow)

**Modified:**
- `site/tailwind.config.mjs` — replaced `idea-glow`/`bulb-float`/`bulb-float-stay` with `text-flash`/`sequence-glow`/`emoji-float`/`emoji-stretch-blur`(+ `-left`)/`emoji-expand`/`lightning-bolt`/`lightning-branch`/`lightning-flash`. All color-driven keyframes reference `var(--flash-color)` or `var(--bolt-color)`.
- `site/src/content/blog/latent-space-steering-part-1.mdx` — migrated the existing `LightbulbIdea` usage and added new effect usages on the Einstein quote, the "OMG" line, and the "The Spark" heading.
- `AUTHORING.md` §9 — documented all four inline-text effects with prop tables and MDX examples; replaced the old `LightbulbIdea`-specific section.

**Deleted:**
- `site/src/components/animations/LightbulbIdea.tsx` — replaced by `EmojiTextFlashAnimation`.

**Moved:**
- `aiAgentProjectTasks/2026-04-17T1704Z_MORE_ANIMATIONS.md` → `aiAgentProjectTasks/completed/`
