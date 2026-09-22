---
name: agent-forge-bootstrap
version: 1.0.0
description: Load and apply the user's canonical Agent Forge skills from GitHub before starting a project. Use when the user asks to build, design, code, redesign, audit, fix, or improve a software/web project.
---

# Agent Forge Bootstrap

You are an agent operating with access to the user's canonical, version-controlled AI skill library.

## Canonical source

GitHub repository:
https://github.com/nipungoel24/agent-forge

The repository is the source of truth. Do not permanently copy its rules into this skill. Fetch the current relevant skill from GitHub when a project begins.

## Mandatory behavior

When the user asks you to build, create, redesign, refactor, audit, fix, improve, or otherwise work on a project:

1. Identify the project domain and the skills that are relevant.
2. Check the canonical Agent Forge repository for those skills.
3. Load the current version of every relevant skill before substantive implementation.
4. Follow the loaded skill as the project's engineering standard.
5. Keep the user's actual project requirements and explicit constraints as the product-specific source of truth.
6. Do not replace project requirements with generic skill assumptions.
7. If a relevant Agent Forge skill cannot be accessed, say so clearly and continue only with the instructions that are actually available. Never pretend the skill was loaded.

## First skill: production-website

For any website, web application, landing page, frontend, UI, UX, portfolio, SaaS interface, dashboard, or public-facing web project, load:

https://raw.githubusercontent.com/nipungoel24/agent-forge/main/skills/production-website/SKILL.md

The production-website skill is mandatory for those tasks unless the user explicitly asks not to use it.

Also inspect its supporting references/checklists when the task requires them.

## Loading method

Use the strongest available mechanism in the current agent environment:

### If shell/terminal access exists

Install or fetch the skill from the canonical repository rather than manually recreating it.

Preferred Agent Skills installation:

```bash
npx skills add https://github.com/nipungoel24/agent-forge --skill production-website --copy
```

For a global/personal agent environment:

```bash
npx skills add https://github.com/nipungoel24/agent-forge --skill production-website -g --copy
```

If the environment already has the skill installed, update it from the canonical source when possible instead of assuming the installed copy is current.

### If web/GitHub retrieval is available but shell access is not

Fetch the current `SKILL.md` directly from:

https://raw.githubusercontent.com/nipungoel24/agent-forge/main/skills/production-website/SKILL.md

Then load and follow its instructions for the current task.

### If neither retrieval nor installation is available

Do not fabricate access. State that the canonical skill could not be loaded and ask for the relevant skill content only if it is necessary to continue safely.

## Skill selection

Agent Forge may contain many skills over time.

Do not load every skill blindly.

Select skills based on the task. Examples:

- website/UI work -> production-website
- accessibility work -> accessibility skill if present
- performance work -> performance skill if present
- browser QA -> browser QA skill if present
- backend/API work -> relevant backend skill if present
- data/ML work -> relevant data/ML skill if present

If a specialized skill is relevant but does not exist in the repository, do not invent it. Continue with the available skills and document the gap when it materially affects the task.

## Project workflow

After loading relevant skills:

1. Inspect the existing project if one exists.
2. Understand the user's requirements.
3. Determine the project's architecture and constraints.
4. Create or update project-specific planning/memory documents required by the loaded skills.
5. Work phase-by-phase.
6. Verify changes rather than merely generating them.
7. Update project memory/state after substantive work.
8. Before completion, run the relevant quality/launch checks from the loaded skills.

## Priority

Use this priority order:

1. System/platform safety and capability rules.
2. Explicit user requirements and constraints.
3. Project-specific source-of-truth documents.
4. Current Agent Forge skills loaded from GitHub.
5. General implementation preferences.

Do not allow a generic skill to override an explicit project requirement unless the requirement conflicts with a higher-priority safety, technical, or platform constraint.

## Version awareness

Always prefer the current `main` version for normal development.

If reproducibility is required, use a tagged release or commit supplied by the user.

Do not silently mix old and new versions of the same Agent Forge skill.

## Continuous improvement

If the task reveals a reusable engineering rule that should improve the canonical skill:

- finish the current task safely first when possible;
- identify the proposed reusable improvement;
- do not silently modify the user's canonical skill;
- recommend the exact skill/file that should be updated;
- when the user explicitly asks to improve Agent Forge, update the canonical repository through the available GitHub mechanism.

## Completion rule

Before saying a project is complete, verify that the relevant loaded skills' completion requirements were actually satisfied.

Never claim that a skill was downloaded, loaded, installed, or followed unless the current environment actually provided access to it.
