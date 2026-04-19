---
name: completeTask
description: Close out a task from `aiAgentProjectTasks/`. Use when the user says "complete this task", "close this task", or invokes `/completeTask <path>`. Writes a work-history entry describing what was actually done in the session, moves the task file to `aiAgentProjectTasks/completed/`, then commits and pushes both changes together with any other pending work in the tree.
---

# completeTask

Close out a project task after the actual implementation work is already finished in the conversation. This skill does the bookkeeping: a durable work-history record, the file move, and the commit/push.

## Input

One argument: the path to the task file to close, e.g. `aiAgentProjectTasks/2026-04-17T1704Z_MORE_ANIMATIONS.md`.

If the user invoked `/completeTask` with no argument, ask them which task file to close and stop until they answer. Do not guess.

## Precondition

The substantive work for the task should already be done in the current conversation (code written, tests/checks run, any user-visible verification complete). This skill is about recording and shipping, not implementing. If you haven't actually done the work yet, say so and don't run this skill.

## Steps

### 1. Read the task file

Read the referenced task file so the work-history entry can reflect how the final result did or didn't match the original ask.

### 2. Gather git context

Run these in parallel (Bash):
- `git status --short` — what's changed in the tree.
- `git log -5 --pretty=format:'%h %s'` — recent commit message style to match.
- `git diff --stat` — summary of modified files.

Use these to inform the work-history entry and the commit message.

### 3. Write the work-history entry

Create `aiAgentWorkHistory/<ISO-UTC-timestamp>_<short-kebab-name>.md`. Filename convention: same timestamp format as `aiAgentProjectTasks/` (e.g. `2026-04-19T0000Z_more-animations.md`). The short name should describe the outcome, not the task ID.

Use the **current date and time in UTC** for the timestamp. Do not reuse the task file's timestamp (that was when the task was *opened*, not when it was completed).

Follow the structure already established in prior entries (see the most recent file in `aiAgentWorkHistory/` as a template). Minimum sections:

- Top metadata block: `Date`, `Agent` (model + "Claude Code CLI"), `Task source` (points to the new location under `completed/`), `Status`.
- `## Summary` — 1–2 paragraphs on what was actually delivered.
- `## Changes by phase` — narrative of how the work unfolded, including bugs hit and how they were resolved. Concrete code/file references where they add clarity.
- `## Decisions worth recording` — non-obvious architectural or API decisions that future-you would want to know.
- `## Verification performed` and anything explicitly **not** performed.
- `## Out of scope (intentional, not gaps)` — things that could have been in scope but were consciously deferred.
- `## Files changed` — grouped by New / Modified / Deleted / Moved.

Prefer honesty over polish: record the bugs that were hit, the dead-ends, and the decisions that got reversed. The work history is the durable record that future agents and the user will actually refer back to.

### 4. Move the task file

```bash
mv aiAgentProjectTasks/<task-filename>.md aiAgentProjectTasks/completed/<task-filename>.md
```

Use plain `mv` if the task file is untracked by git; use `git mv` only if it's already tracked. `git status` from step 2 tells you which. (The task file will usually be untracked — tasks are typically added and closed within the same branch cycle without being committed mid-flight.)

### 5. Stage, commit, push

Stage the whole set of changes for this task — the task-file move, the work-history entry, and all the code changes that implemented the task. Do **not** use `git add -A` / `git add .`; add by explicit path list to avoid accidentally picking up unrelated noise or secrets.

Look at `git status` one more time before committing and decide per-path whether each entry belongs in this commit. If something looks unrelated to the task, leave it unstaged and mention it to the user.

Commit message format — match the style of recent commits (see `git log` output). One-line subject, imperative mood, under ~70 chars; optional body only if there's something non-obvious to say. Include the standard Claude Code trailer:

```
<subject line>

<optional body>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

Pass the message via HEREDOC so formatting is preserved:

```bash
git commit -m "$(cat <<'EOF'
Subject line

Optional body.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

If a pre-commit hook fails, fix the underlying issue and create a **new** commit — do **not** use `--amend` or `--no-verify`.

Then push:

```bash
git push
```

If the current branch has no upstream, push with `-u <remote> <branch>` to set it. Don't force-push.

### 6. Report back

One short message to the user summarizing:
- Path of the new work-history entry.
- That the task was moved to `completed/`.
- The commit SHA and that push succeeded (or the push output if the user needs to see it).

## Notes

- This skill deliberately does **not** update CLAUDE.md, README.md, or AUTHORING.md — those updates should have happened as part of the actual task work, not as part of closing it out. If they're missing, say so to the user and stop.
- Do not run `pnpm build` or full test suites as part of this skill; those should already have been run during the task work. If the user hasn't run verification, say so and stop rather than silently committing unverified changes.
- Never commit files that look like secrets (`.env`, `credentials.*`, token files, etc.). If you see any, flag them to the user and stop.
- If there's no meaningful diff (e.g. task was a no-op or the work landed in a prior commit), don't create an empty commit. Still move the task file and write the work-history entry, and commit just those two things.
