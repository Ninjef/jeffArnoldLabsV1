# Scroll-triggered Text Animations

**Date:** 2026-04-17
**Agent:** Claude Sonnet 4.6 (Claude Code CLI)
**Task source:** `aiAgentProjectTasks/completed/2026-04-17T1642Z_TEXT_ANIMATIONS.md`
**Status:** Complete (changes staged in working tree; not yet committed or deployed)

---

## Summary

Built the first React island in this repo: a reusable scroll-triggered text animation system for blog posts. The user wanted a lightbulb icon to hover above a specific phrase and the text to briefly glow yellow when it crosses the viewport midpoint, with room to add many more effect variants later.

Delivered:
- A shared `useScrollTrigger` hook encapsulating IntersectionObserver-based fire-line detection.
- A first effect component, `<LightbulbIdea>`, used inline in an MDX blog post.
- Custom Tailwind keyframes + animations (`idea-glow`, `bulb-float`, `bulb-float-stay`).
- Per-component props (`triggerAt`, `bulbStays`) so the user can experiment from MDX without editing the hook.

## Architecture

Chose a **family of small components** sharing one hook, rather than a single parameterized `<ScrollHighlight variant="…">`. Reasoning: each future effect may have its own icon, movement curve, ARIA semantics, and color — keeping them isolated means experiments don't break each other, and new effects are additive rather than coupled.

All effect components live under `site/src/components/animations/`.

## Changes by phase

### Phase 1 — Scroll trigger hook + first effect

Created:
- `site/src/components/animations/useScrollTrigger.ts` — returns `{ ref, fireCount }`. Uses `IntersectionObserver` with `rootMargin` computed from a `triggerAt` fraction (0 = top of viewport, 1 = bottom) to create a zero-height strip at the firing line. `fireCount` is a monotonic counter, not a boolean, so effect components can force-remount decorations via `key={fireCount}` to replay CSS animations.
- `site/src/components/animations/LightbulbIdea.tsx` — renders a 💡 absolutely positioned above the text plus a yellow text-glow, both via Tailwind animation classes.
- `site/tailwind.config.mjs` — added `keyframes.idea-glow`, `keyframes.bulb-float`, `keyframes.bulb-float-stay` and matching `animation` entries.

Wired into `site/src/content/blog/latent-space-steering-part-1.mdx` around a pulled quote using `<LightbulbIdea client:visible>`.

### Phase 2 — Fix hydration children loss

First iteration used `key={\`text-${fireCount}\`}` on the inner span containing `{children}` to force a remount on each fire (so the glow animation would replay cleanly). User reported: on page load, the text appeared for a split second and then disappeared.

Root cause: when Astro hydrates a React island that receives children via MDX, the children are delivered through Astro's island slot mechanism. When React unmounts and remounts the children-containing span (via a `key` change), the slot content doesn't survive the remount — the new React tree sees empty children and the text visibly vanishes.

Fix: keep the text span stable (no `key`). Replay the glow animation via the DOM reflow trick instead:

```ts
useEffect(() => {
  if (fireCount === 0) return;
  const el = textRef.current;
  if (!el) return;
  el.classList.remove('animate-idea-glow');
  void el.offsetWidth; // force reflow
  el.classList.add('animate-idea-glow');
}, [fireCount]);
```

The lightbulb emoji itself *can* safely be keyed-and-remounted because it has no MDX-sourced children — its content is a literal string in the component body.

### Phase 3 — `triggerAt` prop for per-usage tuning

User asked to be able to tune the trigger point from MDX. Replaced the original `triggerPoint: 'midpoint' | 'enter'` option with a continuous `triggerAt: number` (0 = top of viewport, 1 = bottom). Internal rootMargin: `top: -(triggerAt*100)%`, `bottom: -((1-triggerAt)*100)%`. Clamped in-hook to `[0, 1]`.

Passed through as a prop on `LightbulbIdea`, usable from MDX:

```mdx
<LightbulbIdea client:visible triggerAt={0.3}>…</LightbulbIdea>
```

### Phase 4 — `bulbStays` prop

User asked for a variant where the lightbulb persists after the animation rather than fading away. Added `bulbStays?: boolean`:

- `false` (default): bulb floats in, fades out; effect re-fires on every line crossing.
- `true`: bulb fades in with a slight bounce and stays; effect fires at most once per page load (internally sets `once: true` on the hook).

Implemented as a second animation variant (`bulb-float-stay` with `forwards` fill mode) picked at render time based on the prop.

### Phase 5 — Fix default-bulb-not-disappearing bug

User reported the bulb staying visible at the end of the default (non-stays) animation. Root cause: without `animation-fill-mode: forwards`, CSS animations revert to the element's pre-animation style when they finish. The keyframes ended at opacity 0, but after the animation completed the element snapped back to opacity 1 (its natural CSS state).

Fix: add `forwards` to the `bulb-float` animation shorthand in `tailwind.config.mjs`. End state (opacity 0) is now retained after the animation completes. Re-triggers still play fresh because `key={\`bulb-${fireCount}\`}` forces a remount of the bulb span — safe here because no MDX children are involved.

## Decisions worth recording

- **Family of components, not a single variant-parameterized one.** Each effect is its own file sharing `useScrollTrigger`. Scales better for free-form experimentation.
- **`fireCount` (monotonic counter) over `active` (boolean).** Lets decorations force-remount via `key={fireCount}` to replay CSS animations, without imperative animation restarts.
- **DOM reflow trick, not `key` changes, for elements containing MDX children.** `{children}` in React islands must sit in a stable element; otherwise Astro's slot-based hydration loses them.
- **Tailwind animation shorthand needs `forwards` when the end state matters.** Without it, elements snap back to default styling when the animation completes.
- **`client:visible` is sufficient.** Component hydrates as it enters the viewport, well before the fire line — observer is ready in time.

## Verification performed

- `pnpm --filter @jeffarnoldlabs/site check` — passes (0 errors, 0 warnings).
- Manual browser verification by the user: text glows and lightbulb floats on line crossing; `bulbStays` variant and various `triggerAt` values tested interactively.

Not performed:
- Production build (`pnpm build`). Dev server was the test harness.
- Live deploy.

## Out of scope (intentional, not gaps)

- Additional effect components (sparkle pop, underline sweep, etc.). The pattern is set; each new effect is a single-file addition plus a Tailwind config entry.
- Respecting `prefers-reduced-motion`. Worth adding as a cross-cutting concern in the hook before the effect catalog grows.
- Accessibility contrast audit for the glow color.
- Exposing `once` directly on `LightbulbIdea` (currently only controllable by flipping `bulbStays`).

## Files changed

**New:**
- `site/src/components/animations/useScrollTrigger.ts`
- `site/src/components/animations/LightbulbIdea.tsx`
- `aiAgentWorkHistory/2026-04-17T1800Z_text-animations.md` (this file)

**Modified:**
- `site/tailwind.config.mjs` — added `idea-glow`, `bulb-float`, `bulb-float-stay` keyframes + animations.
- `site/src/content/blog/latent-space-steering-part-1.mdx` — imported the component, wrapped the pulled quote.
- `AUTHORING.md` — added §9: scroll-triggered text animations.

**Moved:**
- `aiAgentProjectTasks/2026-04-17T1642Z_TEXT_ANIMATIONS.md` → `aiAgentProjectTasks/completed/`
