# Per-Title Scroll Animations + Unlink `/demos`

**Date:** 2026-04-24
**Agent:** Claude Opus 4.7 (Claude Code CLI)
**Task source:** `aiAgentProjectTasks/completed/2026-04-24T1015Z_more-animations-and-remove-demos`
**Status:** Complete (committed + pushed; not yet deployed)

---

## Summary

The latent-space-steering post had two inline body-text animations plus a full-viewport lightning strike on "The Spark" heading. The task was to strip the body animations, tone down the lightning into something local + subtle, and give every other top-level H2 its own distinct, classy-but-noticeable scroll-triggered animation. Separately, all links to `/demos` were pulled out of the site chrome since there aren't any real demos yet.

Delivered six per-title animation components (one per H2), all following the existing `useScrollTrigger` + Tailwind keyframe pattern, all rendered local to the heading (no full-viewport portal):

- **`TitleBackPeek`** — 👀 emoji slides out from behind the title, does a left/right head-turn, retreats. (AI that's got your Back)
- **`TitleSparkFizzle`** — 4 jagged blue SVG streaks draw outward from a point next to the title, each ending in a bright pop dot. (The Spark)
- **`TitleNumberShuffle`** — a small bracketed mono-font patch rapidly cycles digits then settles on `∑` and fades. (Magic Math: Text Embeddings)
- **`TitleThoughtGather`** — 3 dots drift in from different directions, converge into a cluster, fade together. (Baskets of Thoughts)
- **`TitleDreamRipple`** — a soft sine-wave underline sweeps across beneath the title. (Keep Dreamin')
- **`TitleQuestionClash`** — a ❓ emoji flies in from the right, the title's "?" shakes on impact, a 💥 flashes, ❓ bounces back and fades. (So what?)

## Architecture

Stayed with the established one-file-per-effect pattern and the shared `useScrollTrigger` hook. Two structural choices worth recording:

- **Local positioning, no portal.** Unlike `LightningStrike` (which portals to `document.body` so it can span the viewport), these accents all position `absolute` inside the component's own `relative inline-block` wrapper — typically at `left: 100%` (with an em offset), sometimes wrapping just the trailing glyph. Each accent scales with the title's font size via em units, so they work at any heading size.
- **`fireCount`-keyed remount for restart.** Accents are rendered conditionally on `fireCount > 0` with `key={fireCount}`, which lets `repeat={true}` cleanly restart the CSS animations without classlist gymnastics.

## Changes by phase

### Phase 1 — Planning

Planned in plan mode before any edits. Key scope decisions recorded at `~/.claude/plans/please-take-a-look-harmonic-spring.md`:

- Animate only top-level H2s (skip "Final Thoughts" inside a collapsible, which doesn't trigger reliably on scroll).
- Unlink `/demos` only — leave the routes reachable by URL for later. Do not touch sitemap.
- Leave the previously-added body-text animation components (`EmojiTextFlashAnimation`, `SequentialTextGlow`, `EmojiStretchBlur`, `EmojiExpand`, `LightningStrike`) in place; just stop importing them from the blog post. User preference: keep around for future posts.

### Phase 2 — First pass (six components)

Built all six title components and wired them into the MDX. Removed the two body animations (`EmojiTextFlashAnimation` on the "to be human is to come up with ideas" quote; `SequentialTextGlow` on the "matter and energy" quote) — both reverted to plain prose. Removed the three `/demos` links from `Layout.astro` nav, `404.astro` list, and `index.astro` intro paragraph.

Initial v1 components:
- `TitleTapPulse` (rings), `TitleSparkFizzle` (radial particles), `TitleNumberShuffle`, `TitleThoughtGather`, `TitleDreamRipple`, `TitleQuestionPulse` (ring around `?`).

`astro check` and `build` clean. User reviewed in browser.

### Phase 3 — Iteration on user feedback

Three animations didn't land:

- **"AI that's got your Back" rings were off-theme.** "Looked like a weird water ripple." Rebuilt as `TitleBackPeek` — 👀 emoji peeking out from behind the title's right edge, small head-turn rotation, retreat. Emoji thematically anchors to "got your back."
- **"The Spark" read as an explosion.** User wanted video-game electricity: crackling streaks with small pops at the ends. Rewrote `TitleSparkFizzle` as SVG: 4 jagged zigzag paths drawn with `stroke-dasharray` animation from a central point, each ending in a delayed `<circle>` pop. Switched color from gold `#facc15` to blue `#60a5fa`. Drop-shadow glow filter on both streaks and pops.
- **"So what?" was weak.** User suggested an emoji clashing against the title. Built `TitleQuestionClash`: ❓ flies in from the right (scale/rotate keyframe), the title's children (the `?`) gets a `translateX` shake animation with impact timed to peak ❓ approach, a 💥 emoji does a scale-pop at the collision point, then ❓ bounces back and fades.

Deleted `TitleTapPulse.tsx` and `TitleQuestionPulse.tsx` (both only ever referenced from this one MDX file). Removed their corresponding `title-tap-ring` / `title-question-pulse` / `title-spark-particle` keyframes from `tailwind.config.mjs` and replaced with `title-back-peek`, `title-crackle-streak`, `title-crackle-pop`, `title-clash-fly`, `title-clash-shake`, `title-clash-impact`.

### Phase 4 — Verification and ship

`pnpm --filter @jeffarnoldlabs/site check` clean (0 errors, 0 warnings, 27 files). `build` succeeds, 6 pages. User verified all six animations live in the browser, approved, and asked to ship.

## Decisions worth recording

- **Emojis are the fastest way to make a heading accent feel on-theme.** The first-pass abstract geometric animations (rings, radial particles, ring-around-the-`?`) came out generic. Swapping in concrete emoji actors (👀 peeking, ❓ clashing, 💥 impact) gave the animations a meaning that geometry alone couldn't carry. Worth trying an emoji variant first when the title has a clear visual hook.
- **Local-em-sized accents scale cleanly; viewport-sized portals don't.** Positioning accents at `left: 100%`, sized in `em`, inside the inline-block wrapper means one component works at any heading size with no measurement code. Only reach for `createPortal` + `getBoundingClientRect` when the effect genuinely has to escape the flow (full-viewport flash).
- **Keying conditional accents by `fireCount` restarts CSS animations for free.** `{fireCount > 0 && <span key={fireCount} … />}` — when `fireCount` increments on repeat, React remounts and the keyframe replays from 0% with no offsetWidth-reflow tricks.
- **For per-particle variation (directions, delays), plain inline CSS vars beat Tailwind plugins.** `style={{ '--dx': '15px', '--dy': '-20px' }}` + a keyframe that reads `calc(var(--dx))` in its `transform` works in every modern browser and keeps the styling co-located with the component data.
- **Task files stay untracked until explicit completion.** Commit policy for `/completeTask`-style task lifecycle: the implementation commit should not move the task file; a separate commit (or a `/completeTask` invocation) handles the move + history entry. Keeps the two concerns separable if the implementation ships in multiple PRs.

## Verification performed

- `pnpm --filter @jeffarnoldlabs/site check` — 0 errors across 27 files, after each of the two implementation passes.
- `pnpm --filter @jeffarnoldlabs/site build` — 6 pages built, no errors.
- User visually verified all six animations in the dev server across two iteration cycles; approved final pass.
- Direct `/demos` URL still builds and renders (verified in build output) despite being unlinked from nav/landing/404.

Not performed:
- Live deploy.
- `prefers-reduced-motion` audit — consistent with the existing animation components; deferred for a dedicated pass.

## Out of scope (intentional, not gaps)

- Animating "Final Thoughts" (inside a `<Collapsible>`). Scroll-based triggers don't fire reliably for content hidden behind a disclosure widget.
- Deleting the `/demos` pages or excluding them from the sitemap. User chose "unlink only" — keep routes reachable by URL for later re-linking.
- Deleting the now-unused pre-existing animation components (`EmojiTextFlashAnimation`, `SequentialTextGlow`, `EmojiStretchBlur`, `EmojiExpand`, `LightningStrike`). User chose to keep them around for future posts.
- `prefers-reduced-motion`.
- Extracting a shared "title accent" component/factory. Six distinct visual effects + only one file using them; one-file-per-effect is still the right call.

## Files changed

**New animation components:**
- `site/src/components/animations/TitleBackPeek.tsx`
- `site/src/components/animations/TitleSparkFizzle.tsx`
- `site/src/components/animations/TitleNumberShuffle.tsx`
- `site/src/components/animations/TitleThoughtGather.tsx`
- `site/src/components/animations/TitleDreamRipple.tsx`
- `site/src/components/animations/TitleQuestionClash.tsx`

**Modified:**
- `site/tailwind.config.mjs` — added keyframes/animations: `title-back-peek`, `title-crackle-streak`, `title-crackle-pop`, `title-clash-fly`, `title-clash-shake`, `title-clash-impact`, `title-thought-gather`, `title-dream-ripple`, `title-number-fade`.
- `site/src/content/blog/latent-space-steering-part-1.mdx` — replaced body-text animations with plain prose; wrapped each top-level H2 with its animation component; cleaned up imports.
- `site/src/layouts/Layout.astro` — removed `Demos` nav link.
- `site/src/pages/404.astro` — removed `Demos` list item.
- `site/src/pages/index.astro` — rewrote intro to drop the `/demos` link.

**Deleted (first-pass components, superseded by Phase 3 iteration):**
- `site/src/components/animations/TitleTapPulse.tsx` — replaced by `TitleBackPeek`.
- `site/src/components/animations/TitleQuestionPulse.tsx` — replaced by `TitleQuestionClash`.

**Moved:**
- `aiAgentProjectTasks/2026-04-24T1015Z_more-animations-and-remove-demos` → `aiAgentProjectTasks/completed/`

**Untouched (intentional):**
- `site/src/components/animations/LightningStrike.tsx`, `EmojiTextFlashAnimation.tsx`, `SequentialTextGlow.tsx`, `EmojiStretchBlur.tsx`, `EmojiExpand.tsx` — kept for future posts.
- `site/src/pages/demos/**`, `site/astro.config.mjs`, `site/src/consts.ts` — routes stay reachable; sitemap and site description untouched.
