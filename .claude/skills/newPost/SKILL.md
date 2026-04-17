---
name: newPost
description: Scaffold a new blog post from the template. Use when the user asks to create a new blog post, new post, new blog entry, or invokes /newPost. Prompts for title, description, and gist; derives a slug and tags; copies template.mdx plus co-located assets and the public iframe folder to the new slug, rewriting imports and frontmatter so the post is ready to edit.
---

# newPost

Scaffold a new blog post by duplicating the template at `site/src/content/blog/template.mdx` (and its companion folders) into a new slug. The result is a ready-to-edit post wired up with working image, GIF, and iframe examples that the user can customize or delete.

## Inputs to gather

Use `AskUserQuestion` to collect all three in one prompt:

1. **title** — human-readable post title (e.g. "Notes on retrieval eval").
2. **description** — one-sentence summary for meta tags and the blog index.
3. **gist** — 1–3 sentences on what the post will cover; used to derive tags.

After collecting, derive:

- **slug** — kebab-case from the title: lowercase, replace non-alphanumerics with `-`, collapse and trim dashes. Keep it short (≤ 5 words). Show the derived slug to the user in your next message and proceed unless they push back.
- **tags** — 2–4 short keywords pulled from the gist. Lowercase, single-word when possible. Put them in the frontmatter; the user can edit after.
- **pubDate** — today's date in `YYYY-MM-DD`.

If `site/src/content/blog/<slug>.mdx` or either `<slug>/` folder already exists, stop and ask for a different slug.

## Steps

1. Copy files (use Bash):
   - `cp site/src/content/blog/template.mdx site/src/content/blog/<slug>.mdx`
   - `cp -R site/src/content/blog/template site/src/content/blog/<slug>`
   - `cp -R site/public/blog/template site/public/blog/<slug>`
   - `mv site/public/blog/<slug>/template-example-embedded-page.html site/public/blog/<slug>/<slug>-example-embedded-page.html`

2. Rewrite `site/src/content/blog/<slug>.mdx` via targeted Edit calls:
   - Frontmatter:
     - `title: "Template"` → `title: "<title>"`
     - `description: "..."` → `description: "<description>"`
     - `pubDate: ...` → `pubDate: <today>`
     - `draft: true` → `draft: false`
     - `tags: ["meta"]` → `tags: [<derived tags>]`
   - Asset imports:
     - `./template/usage-limits.png` → `./<slug>/usage-limits.png`
     - `./template/giphy.gif` → `./<slug>/giphy.gif`
   - Iframe src:
     - `/blog/template/template-example-embedded-page.html` → `/blog/<slug>/<slug>-example-embedded-page.html`

3. Report to the user:
   - Path to the new `.mdx`.
   - The URL the post will live at: `/blogs/<slug>`.
   - Suggest `pnpm --filter @jeffarnoldlabs/site dev` for live preview.

## Notes

- Do not run a full build as part of this skill — the template is known-working and the diff is mechanical.
- The example image/GIF/iframe in the scaffolded post are placeholders; the user will typically replace them. Leave them in so the wiring pattern is visible.
- If the user provides only a title (no description/gist), ask for the other two — don't invent them.
