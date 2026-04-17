# Overview

I want to add a blog post to the site, and I want to learn the actual day-to-day authoring workflow while doing it. The repo has `AUTHORING.md` and a `hello-world.mdx` placeholder, but I've never actually exercised the post-creation path end-to-end.

Walk me through it, then help me establish conventions for the different content types a post might need — inline images, GIFs, short videos, and embedded interactive HTML. Use the existing `hello-world` post as the sandbox for demonstration so I can see the wiring concretely rather than in the abstract.

When the workflow is clear, automate the boilerplate. Creating a new post currently involves copying the `.mdx`, copying the co-located assets folder, copying the `public/` iframe folder, and rewriting three categories of references (frontmatter, imports, iframe src). That's mechanical enough to warrant a Claude Code skill — something like `/newPost` that prompts for title, description, and topic, derives a slug and tags, and scaffolds the whole thing from a template.

# In scope

- Explaining the blog post authoring flow in practice: where files go, what the frontmatter schema requires, how the content collection auto-discovers posts.
- Establishing and demonstrating conventions for the three main asset types that aren't plain markdown:
  - **Images** — both the static (`public/`) and optimized (`astro:assets`) paths, with guidance on when to use each.
  - **GIFs** — why the optimized `<Image>` path drops animation, and the right way to keep animation while still getting content hashing.
  - **Embedded interactive HTML** — iframing a self-contained page from `public/`.
- Co-located vs `public/` asset placement, with the convention settled on co-location for post-scoped assets.
- Performance fixes surfaced along the way (eager-loading above-the-fold images, installing `sharp` for Astro's image optimizer).
- Creating a post template (`site/src/content/blog/template.mdx` + co-located folders) that demonstrates all three asset types and serves as the source for new-post scaffolding.
- A `/newPost` Claude Code skill at `.claude/skills/newPost/SKILL.md` that:
  - Asks for title, description, and gist.
  - Derives a human-readable slug and tags.
  - Copies the template `.mdx` + co-located asset folder + `public/blog/<slug>/` iframe folder.
  - Rewrites frontmatter, import paths, and iframe src to the new slug.
  - Leaves the post ready to edit with a working demonstration of each asset type.
- Fixing any pre-existing bugs in the template that would be propagated by the skill.

# Out of scope

- Writing actual blog-post content. The `hello-world` placeholder and template stay as demonstrations; real posts come later.
- Publishing anything to production (no deploy, no commits beyond what I explicitly request).
- New architectural capabilities: no dynamic OG generation pipeline, no reading-time estimation, no tag index pages, no author/series schema expansion.
- Changing the content collection schema in `config.ts`.
- Widening the blog post template route (`[...slug].astro`) to support full-bleed posts — flagged as a possible follow-up if a future post's interactive demo outgrows the `max-w-3xl` column, but not needed now.
- Any infra/CloudFront changes. The existing cache behaviors already serve `public/blog/**` and `_astro/**` correctly.
