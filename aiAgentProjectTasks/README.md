# aiAgentProjectTasks/

Queued tasks for AI agents. Each task is a standalone markdown file describing a discrete unit of work with enough context for an agent to start cold.

## Filename convention

```
<ISO-UTC-timestamp>_<SHORT_SNAKE_CASE_NAME>.md

examples:
  2026-04-11T1010Z_INITIALIZATION.md
  2026-04-17T0915Z_LOOSE_ENDS_CLEANUP.md
```

The timestamp is when the task was *opened* (not when the work happens). ISO-ish format with `Z` for UTC keeps them sorted chronologically in the directory listing.

## Lifecycle

1. **Open**: create the file in `aiAgentProjectTasks/` with the sections below.
2. **In progress**: leave the file where it is while work is happening. Agents can reference the task file directly as context.
3. **Complete**: move the file to `aiAgentProjectTasks/completed/`. Write a companion entry in `aiAgentWorkHistory/` describing what was actually done.

## Task file structure

Minimum sections:

```markdown
# Overview

<One or two paragraphs. What is the task, why does it matter, what's the intended outcome?>

# In scope

- <Bullet-list of what's fair game>

# Out of scope

- <Bullet-list of what's explicitly not this task — prevents scope creep>
```

See `completed/2026-04-17T0915Z_LOOSE_ENDS_CLEANUP.md` for a worked example.

## Companion work history

When a task completes, write `aiAgentWorkHistory/<ISO-timestamp>_<short-name>.md` with:

- What was actually built/changed (files, resources)
- Decisions made, especially where they diverged from the task spec
- Issues hit and how they were resolved
- Any "not done in this session" items that belong in a follow-up task

The work history is the durable record; the task file is the upstream ask.
